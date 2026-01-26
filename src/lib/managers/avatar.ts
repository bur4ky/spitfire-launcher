import { avatarCache } from '$lib/stores';
import { processChunks } from '$lib/utils';
import AuthSession from '$lib/epic/auth-session';
import type { AccountData } from '$types/accounts';
import { avatarService } from '$lib/services/epic';
import type { AvatarData } from '$types/game/avatar';

export default class AvatarManager {
  static async fetchAvatars(account: AccountData, friendIds: string[]) {
    const session = AuthSession.ky(account, avatarService);
    const MAX_IDS_PER_REQUEST = 100;

    const avatarData = await processChunks(
      friendIds,
      MAX_IDS_PER_REQUEST,
      async (ids) => {
        return session.get<AvatarData[]>(`?accountIds=${ids.join(',')}`).json();
      }
    );

    for (const avatar of avatarData) {
      if (avatar.namespace.toLowerCase() !== 'fortnite') continue;

      const cosmeticId = avatar.avatarId.split(':')[1];
      if (!cosmeticId) continue;

      avatarCache.set(avatar.accountId, `https://fortnite-api.com/images/cosmetics/br/${cosmeticId}/smallicon.png`);
    }

    return avatarData;
  }
}