import { fortnitePCGameClient } from '$lib/constants/clients';
import { AuthSession } from '$lib/modules/auth-session';
import { publicAccountService } from '$lib/services/epic';
import type { AccountData } from '$types/account';
import type { EpicDeviceAuthData } from '$types/game/authorizations';

export class DeviceAuth {
  static create(account: AccountData | { accountId: string; accessToken: string }) {
    const token = 'accessToken' in account ? account.accessToken : null;
    const service = 'accessToken' in account ? publicAccountService : AuthSession.ky(account, publicAccountService);

    return service
      .post<EpicDeviceAuthData>(
        `${account.accountId}/deviceAuth`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      )
      .json();
  }

  static get(account: AccountData, deviceId: string) {
    return AuthSession.ky(account, publicAccountService, fortnitePCGameClient)
      .get<EpicDeviceAuthData>(`${account.accountId}/deviceAuth/${deviceId}`)
      .json();
  }

  static getAll(account: AccountData) {
    return AuthSession.ky(account, publicAccountService, fortnitePCGameClient)
      .get<EpicDeviceAuthData[]>(`${account.accountId}/deviceAuth`)
      .json();
  }

  static delete(account: AccountData, deviceId: string) {
    return AuthSession.ky(account, publicAccountService).delete(`${account.accountId}/deviceAuth/${deviceId}`);
  }
}
