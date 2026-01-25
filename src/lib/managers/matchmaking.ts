import LookupManager from '$lib/managers/lookup';
import { matchmakingService } from '$lib/services/epic';
import AuthSession from '$lib/utils/epic/auth-session';
import { displayNamesCache } from '$lib/stores';
import type { MatchmakingTrackResponse } from '$types/game/matchmaking';
import type { AccountData } from '$types/accounts';
import { getChildLogger } from '$lib/utils/logger';

const logger = getChildLogger('MatchmakingManager');

export default class MatchmakingManager {
  static async findPlayer(account: AccountData, accountToFind: string) {
    const data = await AuthSession.ky(account, matchmakingService).get<MatchmakingTrackResponse>(
      `findPlayer/${accountToFind}`
    ).json();

    const notCachedPlayers = data?.[0]?.publicPlayers.filter((x) => !displayNamesCache.has(x));
    if (notCachedPlayers?.length) {
      LookupManager.fetchByIds(account, notCachedPlayers).catch((error) => {
        logger.error('Failed to cache display names for matchmaking findPlayer', { error });
      });
    }

    return data;
  }
}
