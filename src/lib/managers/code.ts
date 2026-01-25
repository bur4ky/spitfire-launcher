import type { AccountData } from '$types/accounts';
import { fulfillmentService } from '$lib/services/epic';
import type { RedeemedCodeData } from '$types/game/fulfillment';
import AuthSession from '$lib/utils/epic/auth-session';

export default class CodeManager {
  static redeem(account: AccountData, code: string) {
    code = encodeURIComponent(code.toUpperCase().replaceAll('-', '').replaceAll('_', '').trim());

    return AuthSession.ky(account, fulfillmentService).post<RedeemedCodeData>(
      `accounts/${account.accountId}/codes/${code}`,
      { json: {} }
    ).json();
  }
}