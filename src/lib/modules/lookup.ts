import { publicAccountService, userSearchService } from '$lib/services/epic';
import EpicAPIError from '$lib/exceptions/EpicAPIError';
import { displayNamesCache } from '$lib/stores';
import { processChunks } from '$lib/utils';
import type { AccountData } from '$types/account';
import AuthSession from '$lib/modules/auth-session';
import type { EpicAccountById, EpicAccountByName, EpicAccountSearch } from '$types/game/lookup';

export default class Lookup {
  static async fetchById(account: AccountData, accountId: string) {
    const data = await AuthSession.ky(account, publicAccountService).get<EpicAccountById>(accountId).json();
    displayNamesCache.set(data.id, data.displayName);
    return data;
  }

  static async fetchByIds(account: AccountData, accountIds: string[]) {
    const MAX_IDS_PER_REQUEST = 100;
    const session = AuthSession.ky(account, publicAccountService);

    const accounts = await processChunks(
      accountIds,
      MAX_IDS_PER_REQUEST,
      async (ids) => {
        return session.get<EpicAccountById[]>(
          `?${ids.map((x) => `accountId=${x}`).join('&')}`
        ).json();
      }
    );

    for (const account of accounts) {
      const name = account.displayName || Object.values(account.externalAuths).map((x) => x.externalDisplayName)?.[0];
      if (!name) continue;

      displayNamesCache.set(account.id, name);
    }

    return accounts;
  }

  static async fetchByName(account: AccountData, displayName: string) {
    const data = await AuthSession.ky(account, publicAccountService).get<EpicAccountByName>(
      `displayName/${displayName.trim()}`
    ).json();

    displayNamesCache.set(data.id, data.displayName);
    return data;
  }

  static async searchByName(account: AccountData, namePrefix: string) {
    const data = await AuthSession.ky(account, userSearchService).get<EpicAccountSearch[]>(
      `${account.accountId}?prefix=${namePrefix.trim()}&platform=epic`
    ).json();

    for (const account of data) {
      const name = account.matches[0]?.value;
      if (!name) continue;

      displayNamesCache.set(account.accountId, name);
    }

    return data;
  }

  static async fetchByNameOrId(account: AccountData, nameOrId: string) {
    const isAccountId = nameOrId.length === 32;
    if (isAccountId) {
      const data = await Lookup.fetchById(account, nameOrId);
      return {
        accountId: data.id,
        displayName: data.displayName
      };
    } else {
      const data = (await Lookup.searchByName(account, nameOrId))?.[0];
      if (!data) throw new EpicAPIError({
        errorCode: 'errors.com.epicgames.account.account_not_found',
        errorMessage: `Sorry, we couldn't find an account for ${nameOrId}`,
        messageVars: [nameOrId],
        numericErrorCode: 18007
      });

      return {
        accountId: data.accountId,
        displayName: data.matches[0].value
      };
    }
  }
}
