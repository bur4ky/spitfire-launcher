import { SvelteMap } from 'svelte/reactivity';
import { writable } from 'svelte/store';
import type { SpitfireShop } from '$types/game/shop';

export type AccountDataCache = Partial<{
  vbucks: number;
  friends: { displayName: string; accountId: string }[];
  remainingGifts: number;
}>;

export const brShopCache = writable<SpitfireShop>();
export const accountDataCache = new SvelteMap<string, AccountDataCache>();
