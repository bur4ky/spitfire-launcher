import { SvelteMap } from 'svelte/reactivity';
import { EpicAPIError } from '$lib/exceptions/EpicAPIError';
import { friendService } from '$lib/http';
import { getChildLogger } from '$lib/logger';
import { AuthSession } from '$lib/modules/auth-session';
import { Avatar } from '$lib/modules/avatar';
import { Lookup } from '$lib/modules/lookup';
import { avatarCache, displayNameCache, friendsCache, type AccountFriends } from '$lib/stores';
import { processChunks } from '$lib/utils';
import type { AccountData } from '$types/account';
import type {
  BlockedAccountData,
  FriendData,
  FriendsSummary,
  IncomingFriendRequestData,
  OutgoingFriendRequestData
} from '$types/game/friends';

const logger = getChildLogger('FriendsManager');

export class Friends {
  static async getFriend(account: AccountData, friendId: string) {
    try {
      const friendData = await AuthSession.ky(account, friendService)
        .get<FriendData>(`${account.accountId}/friends/${friendId}`)
        .json();

      setCollectionItem(account.accountId, 'friends', friendId, friendData);
      Friends.cacheAccountNameAndAvatar(account, friendId);

      return friendData;
    } catch (error) {
      if (error instanceof EpicAPIError && error.errorCode === 'errors.com.epicgames.friends.friendship_not_found') {
        deleteCollectionItem(account.accountId, 'friends', friendId);
      }

      throw error;
    }
  }

  static async addFriend(account: AccountData, friendId: string) {
    try {
      const data = await AuthSession.ky(account, friendService).post(`${account.accountId}/friends/${friendId}`).json();
      const incomingRequest = friendsCache.get(account.accountId)?.incoming.get(friendId);
      if (incomingRequest) {
        deleteCollectionItem(account.accountId, 'incoming', friendId);
        setCollectionItem(account.accountId, 'friends', friendId, {
          accountId: friendId,
          alias: '',
          note: '',
          favorite: false,
          created: new Date().toISOString(),
          mutual: 0
        });
      } else {
        setCollectionItem(account.accountId, 'outgoing', friendId, {
          accountId: friendId,
          mutual: 0,
          favorite: false,
          created: new Date().toISOString()
        });
      }

      Friends.cacheAccountNameAndAvatar(account, friendId);
      return data;
    } catch (error) {
      if (error instanceof EpicAPIError) {
        if (error.errorCode === 'errors.com.epicgames.friends.duplicate_friendship') {
          const friend = friendsCache.get(account.accountId)?.friends.get(friendId);
          if (!friend) {
            setCollectionItem(account.accountId, 'friends', friendId, {
              accountId: friendId,
              alias: '',
              note: '',
              favorite: false,
              created: new Date().toISOString(),
              mutual: 0
            });
          }
        }

        if (error.errorCode === 'errors.com.epicgames.friends.friend_request_already_sent') {
          const outgoing = friendsCache.get(account.accountId)?.outgoing.get(friendId);
          if (!outgoing) {
            setCollectionItem(account.accountId, 'outgoing', friendId, {
              accountId: friendId,
              mutual: 0,
              favorite: false,
              created: new Date().toISOString()
            });
          }
        }
      }

      throw error;
    }
  }

  static async removeFriend(account: AccountData, friendId: string) {
    try {
      const data = await AuthSession.ky(account, friendService).delete(`${account.accountId}/friends/${friendId}`);

      deleteCollectionItem(account.accountId, 'friends', friendId);
      deleteCollectionItem(account.accountId, 'incoming', friendId);
      deleteCollectionItem(account.accountId, 'outgoing', friendId);

      Friends.cacheAccountNameAndAvatar(account, friendId);
      return data;
    } catch (error) {
      if (error instanceof EpicAPIError && error.errorCode === 'errors.com.epicgames.friends.friendship_not_found') {
        deleteCollectionItem(account.accountId, 'friends', friendId);
        deleteCollectionItem(account.accountId, 'incoming', friendId);
        deleteCollectionItem(account.accountId, 'outgoing', friendId);
      }

      throw error;
    }
  }

  static async removeAll(account: AccountData) {
    const data = await AuthSession.ky(account, friendService).delete(`${account.accountId}/friends`);
    getOrInsertEntry(account.accountId).friends.clear();
    return data;
  }

  static async getSummary(account: AccountData) {
    const data = await AuthSession.ky(account, friendService)
      .get<FriendsSummary>(`${account.accountId}/summary`)
      .json();

    const allAccountIds = [
      ...data.friends.map((x) => x.accountId),
      ...data.incoming.map((x) => x.accountId),
      ...data.outgoing.map((x) => x.accountId),
      ...data.blocklist.map((x) => x.accountId)
    ];

    await Promise.allSettled([Lookup.fetchByIds(account, allAccountIds), Avatar.fetchAvatars(account, allAccountIds)]);

    friendsCache.set(account.accountId, {
      friends: new SvelteMap(data.friends.map((x) => [x.accountId, x])),
      incoming: new SvelteMap(data.incoming.map((x) => [x.accountId, x])),
      outgoing: new SvelteMap(data.outgoing.map((x) => [x.accountId, x])),
      blocklist: new SvelteMap(data.blocklist.map((x) => [x.accountId, x]))
    });

    return data;
  }

  static async getFriends(account: AccountData) {
    const data = await AuthSession.ky(account, friendService).get<FriendData[]>(`${account.accountId}/friends`).json();
    replaceCollection(account.accountId, 'friends', data);
    return data;
  }

  static async getIncoming(account: AccountData) {
    const data = await AuthSession.ky(account, friendService)
      .get<IncomingFriendRequestData[]>(`${account.accountId}/incoming`)
      .json();

    replaceCollection(account.accountId, 'incoming', data);
    return data;
  }

  static async getOutgoing(account: AccountData) {
    const data = await AuthSession.ky(account, friendService)
      .get<OutgoingFriendRequestData[]>(`${account.accountId}/outgoing`)
      .json();

    replaceCollection(account.accountId, 'outgoing', data);
    return data;
  }

  static async getBlocklist(account: AccountData) {
    const data = await AuthSession.ky(account, friendService)
      .get<BlockedAccountData[]>(`${account.accountId}/blocklist`)
      .json();
    replaceCollection(account.accountId, 'blocklist', data);
    return data;
  }

  static async block(account: AccountData, friendId: string) {
    const data = await AuthSession.ky(account, friendService).post(`${account.accountId}/blocklist/${friendId}`).json();

    deleteCollectionItem(account.accountId, 'incoming', friendId);
    deleteCollectionItem(account.accountId, 'outgoing', friendId);
    deleteCollectionItem(account.accountId, 'friends', friendId);
    setCollectionItem(account.accountId, 'blocklist', friendId, {
      accountId: friendId,
      created: new Date().toISOString()
    });

    Friends.cacheAccountNameAndAvatar(account, friendId);
    return data;
  }

  static async unblock(account: AccountData, friendId: string) {
    const data = await AuthSession.ky(account, friendService).delete(`${account.accountId}/blocklist/${friendId}`);
    deleteCollectionItem(account.accountId, 'blocklist', friendId);
    Friends.cacheAccountNameAndAvatar(account, friendId);
    return data;
  }

  static async changeNickname(account: AccountData, friendId: string, nickname: string) {
    const data = await AuthSession.ky(account, friendService).put(`${account.accountId}/friends/${friendId}/alias`, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: nickname
    });

    const friend = friendsCache.get(account.accountId)?.friends.get(friendId) ?? {
      accountId: friendId,
      alias: '',
      note: '',
      favorite: false,
      created: new Date().toISOString(),
      mutual: 0
    };

    setCollectionItem(account.accountId, 'friends', friendId, {
      ...friend,
      alias: nickname
    });

    Friends.cacheAccountNameAndAvatar(account, friendId);
    return data;
  }

  static async acceptIncomingMulti(account: AccountData, accountIds: string[]) {
    const MAX_IDS_PER_REQUEST = 100;
    const session = AuthSession.ky(account, friendService);

    const acceptedRequests = await processChunks(accountIds, MAX_IDS_PER_REQUEST, async (ids) =>
      session.post<string[]>(`${account.accountId}/incoming/accept?targetIds=${ids.join(',')}`, { json: {} }).json()
    );

    for (const friendId of acceptedRequests) {
      deleteCollectionItem(account.accountId, 'incoming', friendId);
      setCollectionItem(account.accountId, 'friends', friendId, {
        accountId: friendId,
        alias: '',
        note: '',
        favorite: false,
        created: new Date().toISOString(),
        mutual: 0
      });
    }

    return acceptedRequests;
  }

  static cacheAccountNameAndAvatar(account: AccountData, accountId: string) {
    if (!displayNameCache.get(accountId)) {
      Lookup.fetchById(account, accountId).catch((error) => {
        logger.error('Failed to fetch account display name for caching', { accountId, error });
      });
    }

    if (!avatarCache.get(accountId)) {
      Avatar.fetchAvatars(account, [accountId]).catch((error) => {
        logger.error('Failed to fetch account avatar for caching', { accountId, error });
      });
    }
  }
}

type FriendsCollectionKey = keyof AccountFriends;

// TODO: Use getOrInsert when implemented https://github.com/sveltejs/svelte/issues/18014
// and remove the export
export function getOrInsertEntry(accountId: string) {
  let entry = friendsCache.get(accountId);
  if (!entry) {
    entry = {
      friends: new SvelteMap(),
      incoming: new SvelteMap(),
      outgoing: new SvelteMap(),
      blocklist: new SvelteMap()
    };

    friendsCache.set(accountId, entry);
  }

  return entry;
}

function replaceCollection<K extends FriendsCollectionKey, T extends { accountId: string }>(
  accountId: string,
  key: K,
  data: T[]
) {
  const entry = getOrInsertEntry(accountId);
  const map = entry[key];

  map.clear();
  for (const item of data) {
    // @ts-expect-error - this is fine
    map.set(item.accountId, item);
  }
}

function setCollectionItem<K extends FriendsCollectionKey>(
  accountId: string,
  collection: K,
  friendId: string,
  data: AccountFriends[K] extends SvelteMap<string, infer V> ? V : never
) {
  const entry = getOrInsertEntry(accountId);
  const map = entry[collection] as SvelteMap<string, unknown>;
  map.set(friendId, data);
}

export function deleteCollectionItem(accountId: string, collection: FriendsCollectionKey, friendId: string) {
  const entry = getOrInsertEntry(accountId);
  entry[collection].delete(friendId);
}
