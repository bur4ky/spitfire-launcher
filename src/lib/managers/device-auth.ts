import { publicAccountService } from '$lib/services/epic';
import type { EpicDeviceAuthData } from '$types/game/authorizations';
import type { AccountData } from '$types/accounts';
import AuthSession from '$lib/utils/epic/auth-session';

export default class DeviceAuthManager {
  static create(account: AccountData | { accountId: string; accessToken: string }) {
    const token = 'accessToken' in account ? account.accessToken : null;
    const service = 'accessToken' in account ? publicAccountService : AuthSession.ky(account, publicAccountService);
    
    return service.post<EpicDeviceAuthData>(
      `${account.accountId}/deviceAuth`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    ).json();
  }

  static get(account: AccountData, deviceId: string) {
    return AuthSession.ky(account, publicAccountService).get<EpicDeviceAuthData>(
      `${account.accountId}/deviceAuth/${deviceId}`
    ).json();
  }

  static getAll(account: AccountData) {
    return AuthSession.ky(account, publicAccountService).get<EpicDeviceAuthData[]>(
      `${account.accountId}/deviceAuth`
    ).json();
  }

  static delete(account: AccountData, deviceId: string) {
    return AuthSession.ky(account, publicAccountService).delete(
      `${account.accountId}/deviceAuth/${deviceId}`
    );
  }
}
