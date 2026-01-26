import type { KyInstance } from 'ky';
import AsyncLock from '$lib/async-lock';
import Authentication from '$lib/epic/authentication';
import type { AccountData } from '$types/accounts';
import { getChildLogger } from '$lib/logger';
import EpicAPIError from '$lib/exceptions/EpicAPIError';

const logger = getChildLogger('AuthSession');

// This allows us to have one access token per account
type AuthState = {
  accessToken: string;
  expiresAt: number;
  lock: AsyncLock;
};

export default class AuthSession {
  private static states = new Map<string, AuthState>();
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
          return error instanceof EpicAPIError && (
            error.errorCode === 'errors.com.epicgames.common.authentication.token_verification_failed'
            || error.errorCode === 'errors.com.epicgames.common.oauth.invalid_token'
          );
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
            this.invalidate();
            const token = await this.getAccessToken();
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

  async getAccessToken() {
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

    const data = await Authentication.getAccessTokenUsingDeviceAuth(this.account);
    this.state.accessToken = data.access_token;
    this.state.expiresAt = Date.now() + data.expires_in * 1000;
  }

  private tokenValid() {
    return !!this.state.accessToken && Date.now() < this.state.expiresAt;
  }

  private invalidate() {
    this.state.accessToken = '';
    this.state.expiresAt = 0;
  }
}
