import type { AccountCacheData } from '$types/account';
import type {
  BlockedAccountData,
  FriendData,
  IncomingFriendRequestData,
  OutgoingFriendRequestData
} from '$types/game/friends';
import type { PartyData } from '$types/game/party';
import type { SpitfireShop, SpitfireShopItem } from '$types/game/shop';
import type { ParsedWorldInfo } from '$types/game/stw/world-info';
import type { ParsedApp } from '$types/legendary';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { derived, writable } from 'svelte/store';

export const runningAppIds = new SvelteSet<string>();
export const ownedItemsStore = writable<Record<string, Set<string>>>({});
export const ownedApps = writable<ParsedApp[]>([]);
export const displayNamesCache = new SvelteMap<string, string>();
export const avatarCache = new SvelteMap<string, string>();
export const worldInfoCache = writable<ParsedWorldInfo>(new Map());
export const claimedMissionAlerts = new SvelteMap<string, SvelteSet<string>>();
export const brShopStore = writable<SpitfireShop>();
export const accountPartiesStore = new SvelteMap<string, PartyData>();
export const accountCacheStore = writable<Record<string, AccountCacheData>>({});

export type FriendsEntry = {
  friends: SvelteMap<string, FriendData>;
  incoming: SvelteMap<string, IncomingFriendRequestData>;
  outgoing: SvelteMap<string, OutgoingFriendRequestData>;
  blocklist: SvelteMap<string, BlockedAccountData>;
};

export const friendsStore = new SvelteMap<string, FriendsEntry>();

export function createDiscountedStore(accountId: string | undefined, item: SpitfireShopItem) {
  return derived(
    ownedItemsStore,
    ($ownedItemsStore) => {
      if (!accountId) return item.price.final;

      const ownedItems = $ownedItemsStore[accountId];
      const isBundle = item.contents.some((content) => content.alreadyOwnedPriceReduction != null);
      if (!ownedItems?.size || !isBundle) return item.price.final;

      return item.contents.reduce((acc, content) => {
        const isOwned = ownedItems.has(content.id?.toLowerCase());
        const reduction = isOwned ? content.alreadyOwnedPriceReduction || 0 : 0;
        return Math.max(acc - reduction, item.price.floor);
      }, item.price.final);
    },
    0
  );
}

export function createIsOwnedStore(accountId: string | undefined, item: SpitfireShopItem) {
  return derived(
    ownedItemsStore,
    ($ownedItemsStore) => {
      if (!accountId) return false;

      const ownedItems = $ownedItemsStore[accountId];
      if (item.contents.length) {
        return item.contents.every((content) => {
          const contentId = content.id?.toLowerCase();
          return contentId ? ownedItems?.has(contentId) : false;
        });
      } else {
        const itemId = item.id?.toLowerCase();
        return itemId ? ownedItems?.has(itemId) : false;
      }
    },
    false
  );
}
