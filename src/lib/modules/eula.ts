import { AuthSession } from '$lib/modules/auth-session';
import { eulaService } from '$lib/services/epic';
import type { AccountData } from '$types/account';
import type { EULACheckData } from '$types/game/eula';

export class EULA {
  // Returns null if EULA is accepted
  static async check(account: AccountData) {
    const response = await AuthSession.ky(account, eulaService).get<EULACheckData>(
      `account/${account.accountId}`
    );

    if (response.status === 204) return null;
    return response.json();
  }

  static accept(account: AccountData, version: number) {
    return AuthSession.ky(account, eulaService).post(
      `version/${version}/${account.accountId}/accept`
    );
  }
}
