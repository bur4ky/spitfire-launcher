import defaultPartyMemberMeta from '$lib/data/default-party-member-meta.json';
import defaultPartyMeta from '$lib/data/default-party-meta.json';
import { EpicAPIError } from '$lib/exceptions/EpicAPIError';
import { AuthSession } from '$lib/modules/auth-session';
import { partyService } from '$lib/services/epic';
import { accountPartiesStore, avatarCache, displayNamesCache } from '$lib/stores';
import type { AccountData } from '$types/account';
import type { FetchPartyResponse, InviterPartyResponse } from '$types/game/party';

export class Party {
  static async get(account: AccountData) {
    const data = await AuthSession.ky(account, partyService)
      .get<FetchPartyResponse>(`user/${account.accountId}`)
      .json();

    const partyData = data.current[0];
    if (partyData) {
      accountPartiesStore.set(account.accountId, partyData);

      for (const member of partyData.members) {
        const name = member.meta['urn:epic:member:dn_s'] || member.connections?.[0]?.meta?.['account_pl_dn'];
        if (name) {
          displayNamesCache.set(member.account_id, name);
        }

        const loadoutJ = member.meta['Default:AthenaCosmeticLoadout_j'];
        if (loadoutJ) {
          const loadout = JSON.parse(loadoutJ).AthenaCosmeticLoadout;
          const equippedCharacterId = loadout?.characterPrimaryAssetId?.split(':')[1];
          if (equippedCharacterId) {
            avatarCache.set(
              member.account_id,
              `https://fortnite-api.com/images/cosmetics/br/${equippedCharacterId}/smallicon.png`
            );
          }
        }
      }
    }

    return data;
  }

  static kick(account: AccountData, partyId: string, accountToKick: string) {
    return AuthSession.ky(account, partyService).delete(`parties/${partyId}/members/${accountToKick}`).json();
  }

  static leave(account: AccountData, partyId: string) {
    return Party.kick(account, partyId, account.accountId);
  }

  static promote(account: AccountData, partyId: string, accountToPromote: string) {
    return AuthSession.ky(account, partyService).post(`parties/${partyId}/members/${accountToPromote}/promote`).json();
  }

  static patchParty(account: AccountData, partyId: string, revision: number, update: Record<string, string>) {
    const body = {
      revision,
      meta: {
        deleted: [],
        update: { ...defaultPartyMeta, ...update }
      }
    };

    return Party.patchWithRetry(account, `parties/${partyId}`, body);
  }

  static patchSelf(account: AccountData, partyId: string, revision: number, update: Record<string, string>) {
    const body = {
      revision,
      deleted: [],
      update: { ...defaultPartyMemberMeta, ...update }
    };

    return Party.patchWithRetry(account, `parties/${partyId}/members/${account.accountId}/meta`, body);
  }

  private static async patchWithRetry(account: AccountData, url: string, body: Record<string, any>) {
    try {
      return await AuthSession.ky(account, partyService).patch(url, { json: body }).json();
    } catch (error) {
      if (error instanceof EpicAPIError && error.errorCode === 'errors.com.epicgames.social.party.stale_revision') {
        const newRevision = Number.parseInt(error.messageVars[1]);
        if (!Number.isNaN(newRevision)) {
          return AuthSession.ky(account, partyService)
            .patch(url, { json: { ...body, revision: newRevision } })
            .json();
        }
      }

      throw error;
    }
  }

  static invite(account: AccountData, partyId: string, friendToInvite: string) {
    return AuthSession.ky(account, partyService)
      .post(`parties/${partyId}/invites/${friendToInvite}?sendPing=true`, {
        json: {
          'urn:epic:invite:platformdata_s': ''
        }
      })
      .json();
  }

  static getInviterParty(account: AccountData, senderId: string) {
    return AuthSession.ky(account, partyService)
      .get<[InviterPartyResponse]>(`user/${account.accountId}/pings/${senderId}/parties`)
      .json();
  }

  static async acceptInvite(
    account: AccountData,
    partyId: string,
    senderId: string,
    jid: string,
    meta: Record<string, string> = {}
  ) {
    await AuthSession.ky(account, partyService)
      .post(`parties/${partyId}/members/${account.accountId}/join`, {
        json: {
          connection: {
            id: jid,
            meta: {
              'urn:epic:conn:platform_s': 'WIN',
              'urn:epic:conn:type_s': 'game'
            },
            yield_leadership: false
          },
          meta: {
            ...defaultPartyMemberMeta,
            ...meta,
            'urn:epic:member:dn_s': account.displayName,
            'urn:epic:member:joinrequestusers_j': JSON.stringify({
              users: [
                {
                  id: account.accountId,
                  dn: account.displayName,
                  plat: 'WIN',
                  data: JSON.stringify({
                    CrossplayPreference: '1',
                    SubGame_u: '1'
                  })
                }
              ]
            })
          }
        }
      })
      .json();

    await AuthSession.ky(account, partyService).delete(`user/${account.accountId}/pings/${senderId}`);
  }
}
