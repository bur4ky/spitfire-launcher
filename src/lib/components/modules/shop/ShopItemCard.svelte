<script lang="ts">
  import { ItemColors } from '$lib/constants/item-colors';
  import { language, t } from '$lib/i18n';
  import { accountStore } from '$lib/storage';
  import { ownedItemsStore } from '$lib/stores';
  import { calculateDiscountedShopPrice } from '$lib/utils';
  import type { SpitfireShopItem } from '$types/game/shop';
  import CheckIcon from '@lucide/svelte/icons/check';
  import { derived as jsDerived } from 'svelte/store';

  type ItemCardProps = {
    item: SpitfireShopItem;
    modalOfferId: string;
  };

  const activeAccount = accountStore.getActiveStore(true);
  let { item, modalOfferId = $bindable() }: ItemCardProps = $props();

  const isItemOwned = $derived($ownedItemsStore[$activeAccount?.accountId || '']?.has(item.id?.toLowerCase()));
  const discountedPrice = jsDerived(
    [activeAccount, ownedItemsStore],
    ([$activeAccount]) =>
      !$activeAccount ? item.price.final : calculateDiscountedShopPrice($activeAccount.accountId, item),
    0
  );

  const colors: Record<string, string> = { ...ItemColors.rarities, ...ItemColors.series };

  const imageUrl = $derived(item.assets.featured || item.assets.large || item.assets.small);
  const backgroundColorHex = $derived.by(() => {
    const seriesId = item.series?.id?.toLowerCase() || '';
    const rarityId = item.rarity?.id?.toLowerCase();
    return colors[seriesId] || colors[rarityId] || colors.common;
  });

  function showItemModal() {
    modalOfferId = item.offerId;
  }
</script>

<div
  style="background-color: {backgroundColorHex}"
  class="relative w-full cursor-pointer overflow-hidden rounded-xl pb-[100%] transition-all duration-300 hover:scale-105 focus:scale-105"
  onclick={showItemModal}
  onkeydown={(event) => event.key === 'Enter' && showItemModal()}
  role="button"
  tabindex="0"
>
  {#if imageUrl}
    <img
      class="absolute inset-0 size-full object-cover select-none"
      alt={item.name}
      draggable="false"
      loading="lazy"
      src={imageUrl}
    />
  {/if}

  <div class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-2.5">
    <h3 style="text-shadow: 0 2px 4px #000000" class="mb-2 text-left text-lg leading-none font-bold text-white">
      {item.name}
    </h3>

    <div class="relative flex items-center justify-start pl-6">
      {#if isItemOwned}
        <CheckIcon class="absolute top-1/2 left-0 size-5 -translate-y-1/2 text-green-500" />
      {:else}
        <img
          class="absolute top-1/2 left-0 size-5 -translate-y-1/2"
          alt={$t('vbucks')}
          draggable="false"
          src="/resources/currency_mtxswap.png"
        />
      {/if}

      <span
        style="text-shadow: 0 2px 4px #000000"
        class="pb-0.5 text-sm font-bold"
        class:text-green-500={isItemOwned}
        class:text-white={!isItemOwned}
      >
        {#if isItemOwned}
          {$t('itemShop.owned')}
        {:else if $discountedPrice !== item.price.final}
          {$discountedPrice.toLocaleString($language)}
          <span class="text-white/95 line-through">{item.price.final.toLocaleString($language)}</span>
        {:else}
          {item.price.final.toLocaleString($language)}
        {/if}
      </span>
    </div>
  </div>
</div>
