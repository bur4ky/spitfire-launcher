import { fulfillmentService } from '$lib/http';
import { AuthSession } from '$lib/modules/auth-session';
import type { AccountData } from '$types/account';
import type { RedeemedCodeData } from '$types/game/fulfillment';

export class Code {
  static redeem(account: AccountData, code: string) {
    code = encodeURIComponent(code.toUpperCase().replaceAll('-', '').replaceAll('_', '').trim());

    return AuthSession.ky(account, fulfillmentService)
      .post<RedeemedCodeData>(`accounts/${account.accountId}/codes/${code}`, { json: {} })
      .json();
  }
}
