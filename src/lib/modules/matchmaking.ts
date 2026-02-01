import { getChildLogger } from '$lib/logger';
import AuthSession from '$lib/modules/auth-session';
import Lookup from '$lib/modules/lookup';
import { matchmakingService } from '$lib/services/epic';
import { displayNamesCache } from '$lib/stores';
import type { AccountData } from '$types/account';
import type { MatchmakingTrackResponse } from '$types/game/matchmaking';

const logger = getChildLogger('MatchmakingManager');

export default class Matchmaking {
  static async findPlayer(account: AccountData, accountToFind: string) {
    const data = await AuthSession.ky(account, matchmakingService).get<MatchmakingTrackResponse>(
      `findPlayer/${accountToFind}`
    ).json();

    const notCachedPlayers = data?.[0]?.publicPlayers.filter((x) => !displayNamesCache.has(x));
    if (notCachedPlayers?.length) {
      Lookup.fetchByIds(account, notCachedPlayers).catch((error) => {
        logger.error('Failed to cache display names for matchmaking findPlayer', { error });
      });
    }

    return data;
  }
}
