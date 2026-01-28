<script lang="ts">
  import * as Dialog from '$components/ui/dialog';
  import * as Tooltip from '$components/ui/tooltip';
  import { calculateDiscountedShopPrice } from '$lib/utils';
  import { t } from '$lib/i18n';
  import { Badge } from '$components/ui/badge';
  import { Separator } from '$components/ui/separator';
  import { Button } from '$components/ui/button';
  import GiftIcon from '@lucide/svelte/icons/gift';
  import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
  import CheckIcon from '@lucide/svelte/icons/check';
  import { ItemColors } from '$lib/constants/item-colors';
  import { accountCacheStore, brShopStore, ownedItemsStore } from '$lib/stores';
  import ShopPurchaseConfirmation from '$components/modules/shop/modals/ShopPurchaseConfirmation.svelte';
  import ShopGiftFriendSelection from '$components/modules/shop/modals/ShopGiftFriendSelection.svelte';
  import type { AccountCacheData } from '$types/account';
  import { derived as jsDerived } from 'svelte/store';
  import { accountStore } from '$lib/storage';
  import { language } from '$lib/i18n';

  type Props = {
    offerId: string;
  };

  let { offerId = $bindable() }: Props = $props();

  const item = $brShopStore.offers.find((x) => x.offerId === offerId)!;
  let isOpen = $state(true);

  const {
    vbucks: ownedVbucks = 0,
    friends = [],
    remainingGifts = 5
  } = $derived<AccountCacheData>($accountCacheStore[$accountStore.activeAccountId!] || {});

  const colors: Record<string, string> = { ...ItemColors.rarities, ...ItemColors.series };
  const ownedItems = $derived($ownedItemsStore[$accountStore.activeAccountId!]);
  const isItemOwned = $derived(ownedItems?.has(item.id?.toLowerCase()));
  const discountedPrice = jsDerived(
    [accountStore, ownedItemsStore],
    ([$accountStore]) => calculateDiscountedShopPrice($accountStore.activeAccountId!, item),
    0
  );

  let isPurchasing = $state(false);
  let isPurchaseDialogOpen = $state(false);
  let isGiftDialogOpen = $state(false);
  let isSendingGifts = $state(false);

  function getItemColor() {
    const rarityId = (item.series?.id || item.rarity?.id)?.toLowerCase();
    const hexColor = colors[rarityId] || colors.common;

    return `rgba(${hexToRgb(hexColor).join(', ')}, 0.7)`;
  }

  function hexToRgb(hex: string): [number, number, number] {
    hex = hex.replace(/^#/, '');

    let bigint = Number.parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return [r, g, b];
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString($language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<Dialog.Root onOpenChangeComplete={(open) => !open && (offerId = '')} bind:open={isOpen}>
  <Dialog.Content class="!max-w-160 !min-h-96 overflow-y-auto flex flex-col gap-y-6 w-full">
    <div class="flex flex-col xs:flex-row gap-x-6">
      <img
        class="size-48 xs:size-64 object-cover place-self-center xs:place-self-start rounded-md"
        alt={item.name}
        src={item.assets.featured || item.assets.large || item.assets.small}
      />

      <div class="flex flex-col justify-between gap-y-4 mt-3 xs:mt-0">
        <div class="space-y-4">
          <div>
            <h2 class="font-bold text-2xl">{item.name}</h2>
            {#if item.description}
              <p class="text-muted-foreground italic mt-1">
                {item.description}
              </p>
            {/if}
          </div>

          <div class="flex flex-wrap gap-2">
            {#if item.series?.name || item.rarity?.name}
              <Badge
                style="background: {getItemColor()}"
                class="text-foreground font-medium px-3 py-1 rounded-lg capitalize text-sm"
              >
                {(item.series?.name || item.rarity?.name)?.toLowerCase()}
              </Badge>
            {/if}

            {#if item.type?.name}
              <Badge
                class="text-foreground font-medium px-3 py-1 rounded-lg border text-sm"
                variant="outline"
              >
                {item.type?.name}
              </Badge>
            {/if}
          </div>
        </div>

        <div class="flex flex-col">
          <div class="flex items-center gap-1">
            <span class="text-muted-foreground">{$t('itemShop.itemInformation.price')}:</span>

            {#if $discountedPrice !== item.price.final}
              <span class="mr-1">{$discountedPrice.toLocaleString($language)}</span>
              <span class="line-through text-muted-foreground/95">{item.price.final.toLocaleString($language)}</span>
            {:else}
              <span>{item.price.final.toLocaleString($language)}</span>
            {/if}

            <img
              class="size-5"
              alt="V-Bucks"
              src="/resources/currency_mtxswap.png"
            />
          </div>

          <div class="flex items-center gap-1">
            <span class="text-muted-foreground">{$t('itemShop.itemInformation.firstSeen')}:</span>
            <span>{formatDate(item.dates.releaseDate)}</span>
          </div>

          <div class="flex items-center gap-1">
            <span class="text-muted-foreground">{$t('itemShop.itemInformation.lastSeen')}:</span>
            <span>{formatDate(item.dates.lastSeen)}</span>
          </div>

          <div class="flex items-center gap-1">
            <span class="text-muted-foreground">{$t('itemShop.itemInformation.leavesOn')}:</span>
            <span>{formatDate(item.dates.out)}</span>
          </div>
        </div>
      </div>
    </div>

    {#if $accountStore.activeAccountId}
      <Separator />

      <div class="flex w-full gap-3">
        <!-- ignoreNonKeyboardFocus prevents the browser from automatically focusing the tooltip on open -->
        <Tooltip.Root ignoreNonKeyboardFocus={true}>
          <Tooltip.Trigger class="w-full">
            <Button
              class="flex justify-center items-center gap-x-2 w-full"
              disabled={isPurchasing || ownedVbucks < $discountedPrice || isItemOwned}
              onclick={() => isPurchaseDialogOpen = true}
            >
              {#if isItemOwned}
                <CheckIcon class="size-5" />
                {$t('itemShop.owned')}
              {:else}
                <ShoppingCartIcon class="size-5" />
                {$t('itemShop.purchase')}
              {/if}
            </Button>
          </Tooltip.Trigger>

          {#if ownedVbucks < $discountedPrice}
            <Tooltip.Content>{$t('itemShop.notEnoughVbucks')}</Tooltip.Content>
          {/if}
        </Tooltip.Root>

        <Tooltip.Root ignoreNonKeyboardFocus={true}>
          <Tooltip.Trigger class="w-full">
            <Button
              class="flex justify-center items-center gap-x-2 w-full"
              disabled={isSendingGifts || remainingGifts < 1 || ownedVbucks < item.price.final || !item.giftable || !friends.length}
              onclick={() => (isGiftDialogOpen = true)}
              variant="outline"
            >
              <GiftIcon class="size-5" />
              {$t('itemShop.gift')}
            </Button>
          </Tooltip.Trigger>
          {#if remainingGifts < 1}
            <Tooltip.Content>{$t('itemShop.noRemainingGifts')}</Tooltip.Content>
          {:else if ownedVbucks < item.price.final}
            <Tooltip.Content>{$t('itemShop.notEnoughVbucks')}</Tooltip.Content>
          {:else if !friends.length}
            <Tooltip.Content>{$t('itemShop.noFriends')}</Tooltip.Content>
          {/if}
        </Tooltip.Root>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>

{#if $accountStore.activeAccountId}
  <ShopPurchaseConfirmation {isPurchasing} {item} bind:open={isPurchaseDialogOpen} />
  <ShopGiftFriendSelection {isSendingGifts} {item} bind:open={isGiftDialogOpen} />
{/if}