import { derived, writable } from 'svelte/store';
import type { SpitfireShopItem } from '$types/game/shop';
import type { ParsedApp } from '$types/legendary';

export const ownedItemsCache = writable<Record<string, Set<string>>>({});
export const ownedAppsCache = writable<ParsedApp[]>([]);

export function createDiscountedStore(accountId: string | undefined, item: SpitfireShopItem) {
  return derived(
    ownedItemsCache,
    ($ownedItemsCache) => {
      if (!accountId) return item.price.final;

      const ownedItems = $ownedItemsCache[accountId];
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
    ownedItemsCache,
    ($ownedItemsCache) => {
      if (!accountId) return false;

      const ownedItems = $ownedItemsCache[accountId];
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
