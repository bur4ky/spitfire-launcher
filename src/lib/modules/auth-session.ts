import { AsyncLock } from '$lib/async-lock';
import { defaultClient, type ClientCredentials } from '$lib/constants/clients';
import { EpicAPIError, isEpicAPIError } from '$lib/exceptions/EpicAPIError';
import { t } from '$lib/i18n';
import { getChildLogger } from '$lib/logger';
import { Authentication } from '$lib/modules/authentication';
import { accountStore } from '$lib/storage';
import type { AccountData } from '$types/account';
import ky, { isForceRetryError, type KyInstance } from 'ky';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';

const logger = getChildLogger('AuthSession');

// This allows us to have one access token per account per client
type AuthState = {
  accessToken: string;
  expiresAt: number;
  lock: AsyncLock;
};

export class AuthSession {
  // accountId -> clientId -> AuthState
  private static states = new Map<string, Map<string, AuthState>>();
  // Used for preventing duplicate error toasts when the same error occurs repeatedly in a short time period
  private notifiedErrors = new Map<string, number>();
  private readonly kyInstance?: KyInstance;

  private constructor(
    private readonly account: AccountData,
    baseKy?: KyInstance,
    private readonly client: ClientCredentials = defaultClient
  ) {
    this.kyInstance = baseKy?.extend({
      retry: {
        limit: 1,
        shouldRetry: ({ error }) => {
          return isForceRetryError(error);
        }
      },
      hooks: {
        beforeRequest: [
          async (request) => {
            const token = await this.getAccessToken();
            request.headers.set('Authorization', `Bearer ${token}`);
          }
        ],
        afterResponse: [
          async (request, options, response, { retryCount }) => {
            if (response.ok || retryCount > 0) return;

            const data = await response.clone().json();
            if (!isEpicAPIError(data)) return;

            const error = new EpicAPIError(data);
            const shouldRetry = this.handleError(error);
            if (!shouldRetry) return;

            const token = await this.getAccessToken(true);
            const headers = new Headers(request.headers);
            headers.set('Authorization', `Bearer ${token}`);

            return ky.retry({ request: new Request(request, { headers }) });
          }
        ]
      }
    });
  }

  static new(account: AccountData, baseKy?: KyInstance, client: ClientCredentials = defaultClient) {
    let clientMap = AuthSession.states.get(account.accountId);
    if (!clientMap) {
      clientMap = new Map<string, AuthState>();
      AuthSession.states.set(account.accountId, clientMap);
    }

    let state = clientMap.get(client.clientId);
    if (!state) {
      state = {
        accessToken: '',
        expiresAt: 0,
        lock: new AsyncLock()
      };

      clientMap.set(client.clientId, state);
    }

    return new AuthSession(account, baseKy, client);
  }

  // Shortcut method to get a ky instance directly
  static ky(account: AccountData, baseKy?: KyInstance, client?: ClientCredentials) {
    return this.new(account, baseKy, client).ky();
  }

  ky() {
    if (!this.kyInstance) {
      throw new Error('No Ky instance available');
    }

    return this.kyInstance;
  }

  async getAccessToken(forceRefresh = false, client: ClientCredentials = this.client) {
    const clientMap = AuthSession.states.get(this.account.accountId)!;
    const state = clientMap.get(client.clientId)!;

    if (forceRefresh) {
      state.accessToken = '';
      state.expiresAt = 0;
    }

    if (this.tokenValid(state)) {
      return state.accessToken;
    }

    return state.lock.withLock(async () => {
      if (this.tokenValid(state)) {
        return state.accessToken;
      }

      await this.refreshToken(state, client);
      return state.accessToken;
    });
  }

  private async refreshToken(state: AuthState, client: ClientCredentials) {
    logger.debug('Refreshing access token', { accountId: this.account.accountId, clientId: client.clientId });

    try {
      let accessTokenData = await Authentication.getAccessTokenUsingDeviceAuth(this.account);

      if (client.clientId !== defaultClient.clientId) {
        const { code } = await Authentication.getExchangeCodeUsingAccessToken(accessTokenData.access_token);
        accessTokenData = await Authentication.getAccessTokenUsingExchangeCode(code, client);
      }

      state.accessToken = accessTokenData.access_token;
      state.expiresAt = Date.now() + accessTokenData.expires_in * 1000;
    } catch (error) {
      if (error instanceof EpicAPIError) {
        this.handleError(error);
      }

      throw error;
    }
  }

  private tokenValid(state: AuthState) {
    return !!state.accessToken && Date.now() < state.expiresAt;
  }

  private handleError(error: EpicAPIError) {
    if (
      error.errorCode === 'errors.com.epicgames.common.authentication.token_verification_failed' ||
      error.errorCode === 'errors.com.epicgames.common.oauth.invalid_token'
    ) {
      return true;
    }

    const id = this.account.accountId;
    const name = this.account.displayName;
    const translate = get(t);

    if (
      error.errorCode === 'errors.com.epicgames.account.invalid_account_credentials' &&
      this.shouldNotify(`${id}:${error.errorCode}`)
    ) {
      logger.warn('Removing account due to invalid credentials', { accountId: id });
      accountStore.remove(id);
      toast.error(translate('errors.loginExpired', { accountName: name }));
    }

    if (
      error.errorCode === 'errors.com.epicgames.oauth.corrective_action_required' &&
      this.shouldNotify(`${id}:${error.errorCode}`)
    ) {
      logger.warn('Account requires EULA acceptance', { accountId: id });
      toast.error(translate('errors.eulaRequired', { accountName: name }));
    }

    return false;
  }

  private shouldNotify(key: string) {
    const now = Date.now();
    const last = this.notifiedErrors.get(key);
    const ttl = 10_000;
    if (last && now - last < ttl) {
      return false;
    }

    this.notifiedErrors.set(key, now);
    return true;
  }
}
