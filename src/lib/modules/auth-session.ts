import AsyncLock from '$lib/async-lock';
import EpicAPIError from '$lib/exceptions/EpicAPIError';
import { t } from '$lib/i18n';
import { getChildLogger } from '$lib/logger';
import Authentication from '$lib/modules/authentication';
import { accountStore } from '$lib/storage';
import type { AccountData } from '$types/account';
import type { KyInstance } from 'ky';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';

const logger = getChildLogger('AuthSession');

// This allows us to have one access token per account
type AuthState = {
  accessToken: string;
  expiresAt: number;
  lock: AsyncLock;
};

export default class AuthSession {
  private static states = new Map<string, AuthState>();
  // Used for preventing duplicate error toasts when the same error occurs repeatedly in a short time period
  private notifiedErrors = new Map<string, number>();
  private readonly kyInstance?: KyInstance;

  private constructor(
    private readonly account: AccountData,
    private readonly state: AuthState,
    baseKy?: KyInstance
  ) {
    this.kyInstance = baseKy?.extend({
      retry: {
        limit: 1,
        shouldRetry: async ({ error }) => {
          return this.handleError(error);
        }
      },
      hooks: {
        beforeRequest: [
          async (request) => {
            const token = await this.getAccessToken();
            request.headers.set('Authorization', `Bearer ${token}`);
          }
        ],
        beforeRetry: [
          async ({ request }) => {
            const token = await this.getAccessToken(true);
            request.headers.set('Authorization', `Bearer ${token}`);
          }
        ]
      }
    });
  }

  static new(account: AccountData, baseKy?: KyInstance) {
    let state = AuthSession.states.get(account.accountId);
    if (!state) {
      state = {
        accessToken: '',
        expiresAt: 0,
        lock: new AsyncLock()
      };

      AuthSession.states.set(account.accountId, state);
    }

    return new AuthSession(account, state, baseKy);
  }

  // Convenience method to get a ky instance directly
  static ky(account: AccountData, baseKy?: KyInstance) {
    return this.new(account, baseKy).ky();
  }

  ky() {
    if (!this.kyInstance) {
      throw new Error('No kyInstance instance available');
    }

    return this.kyInstance;
  }

  async getAccessToken(forceRefresh = false) {
    if (forceRefresh) {
      this.state.accessToken = '';
      this.state.expiresAt = 0;
    }

    if (this.tokenValid()) {
      return this.state.accessToken;
    }

    return this.state.lock.withLock(async () => {
      if (this.tokenValid()) {
        return this.state.accessToken;
      }

      await this.refreshToken();
      return this.state.accessToken;
    });
  }

  private async refreshToken() {
    logger.debug('Refreshing access token', { accountId: this.account.accountId });

    try {
      const data = await Authentication.getAccessTokenUsingDeviceAuth(this.account);
      this.state.accessToken = data.access_token;
      this.state.expiresAt = Date.now() + data.expires_in * 1000;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  private tokenValid() {
    return !!this.state.accessToken && Date.now() < this.state.expiresAt;
  }

  private handleError(error: unknown) {
    if (!(error instanceof EpicAPIError)) return false;

    if (
      error.errorCode === 'errors.com.epicgames.common.authentication.token_verification_failed'
      || error.errorCode === 'errors.com.epicgames.common.oauth.invalid_token'
    ) {
      return true;
    }

    const id = this.account.accountId;
    const name = this.account.displayName;
    const translate = get(t);

    if (error.errorCode === 'errors.com.epicgames.account.invalid_account_credentials' && this.shouldNotify(`${id}:${error.errorCode}`)) {
      logger.warn('Removing account due to invalid credentials', { accountId: id });
      accountStore.remove(id);
      toast.error(translate('errors.loginExpired', { accountName: name }));
    }

    if (error.errorCode === 'errors.com.epicgames.oauth.corrective_action_required' && this.shouldNotify(`${id}:${error.errorCode}`)) {
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
