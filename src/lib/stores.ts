import type { AccountCacheData } from '$types/account';
import type {
  BlockedAccountData,
  FriendData,
  IncomingFriendRequestData,
  OutgoingFriendRequestData
} from '$types/game/friends';
import type { PartyData } from '$types/game/party';
import type { SpitfireShop } from '$types/game/shop';
import type { ParsedWorldInfo } from '$types/game/stw/world-info';
import type { ParsedApp } from '$types/legendary';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { writable } from 'svelte/store';

export const runningAppIds = new SvelteSet<string>();
export const ownedItemsStore = writable<Record<string, Set<string>>>({});
export const ownedApps = writable<ParsedApp[]>([]);
export const displayNamesCache = new SvelteMap<string, string>();
export const avatarCache = new SvelteMap<string, string>();
export const worldInfoCache = writable<ParsedWorldInfo>(new Map());
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
