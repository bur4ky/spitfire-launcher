import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { writable } from 'svelte/store';
import type {
  BlockedAccountData,
  FriendData,
  IncomingFriendRequestData,
  OutgoingFriendRequestData
} from '$types/game/friends';
import type { PartyData } from '$types/game/party';
import type { ParsedWorldInfo } from '$types/game/stw/world-info';

export const displayNameCache = new SvelteMap<string, string>();
export const avatarCache = new SvelteMap<string, string>();
export const worldInfoCache = writable<ParsedWorldInfo>(new Map());
export const claimedAlerts = new SvelteMap<string, SvelteSet<string>>();
export const runningAppIds = new SvelteSet<string>();
export const partyCache = new SvelteMap<string, PartyData>();

export type AccountFriends = {
  friends: SvelteMap<string, FriendData>;
  incoming: SvelteMap<string, IncomingFriendRequestData>;
  outgoing: SvelteMap<string, OutgoingFriendRequestData>;
  blocklist: SvelteMap<string, BlockedAccountData>;
};

export const friendsCache = new SvelteMap<string, AccountFriends>();
