<script lang="ts">
  import ShopGiftFriendSelection from '$components/modules/shop/modals/ShopGiftFriendSelection.svelte';
  import ShopPurchaseConfirmation from '$components/modules/shop/modals/ShopPurchaseConfirmation.svelte';
  import { Badge } from '$components/ui/badge';
  import { Button } from '$components/ui/button';
  import * as Dialog from '$components/ui/dialog';
  import { Separator } from '$components/ui/separator';
  import * as Tooltip from '$components/ui/tooltip';
  import { ItemColors } from '$lib/constants/item-colors';
  import { language, t } from '$lib/i18n';
  import { accountStore } from '$lib/storage';
  import { accountCacheStore, brShopStore, ownedItemsStore } from '$lib/stores';
  import { calculateDiscountedShopPrice } from '$lib/utils';
  import type { AccountCacheData } from '$types/account';
  import CheckIcon from '@lucide/svelte/icons/check';
  import GiftIcon from '@lucide/svelte/icons/gift';
  import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
  import { derived as jsDerived } from 'svelte/store';

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
  <Dialog.Content class="flex !min-h-96 w-full !max-w-160 flex-col gap-y-6 overflow-y-auto">
    <div class="flex flex-col gap-x-6 xs:flex-row">
      <img
        class="size-48 place-self-center rounded-md object-cover xs:size-64 xs:place-self-start"
        alt={item.name}
        src={item.assets.featured || item.assets.large || item.assets.small}
      />

      <div class="mt-3 flex flex-col justify-between gap-y-4 xs:mt-0">
        <div class="space-y-4">
          <div>
            <h2 class="text-2xl font-bold">{item.name}</h2>
            {#if item.description}
              <p class="mt-1 text-muted-foreground italic">
                {item.description}
              </p>
            {/if}
          </div>

          <div class="flex flex-wrap gap-2">
            {#if item.series?.name || item.rarity?.name}
              <Badge
                style="background: {getItemColor()}"
                class="rounded-lg px-3 py-1 text-sm font-medium text-foreground capitalize"
              >
                {(item.series?.name || item.rarity?.name)?.toLowerCase()}
              </Badge>
            {/if}

            {#if item.type?.name}
              <Badge class="rounded-lg border px-3 py-1 text-sm font-medium text-foreground" variant="outline">
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
              <span class="text-muted-foreground/95 line-through">{item.price.final.toLocaleString($language)}</span>
            {:else}
              <span>{item.price.final.toLocaleString($language)}</span>
            {/if}

            <img class="size-5" alt="V-Bucks" src="/resources/currency_mtxswap.png" />
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

      <div class="grid w-full grid-cols-2 gap-2">
        <Tooltip.Root>
          <Tooltip.Trigger tabindex={-1}>
            <Button
              class="flex w-full items-center justify-center gap-2"
              disabled={isPurchasing || ownedVbucks < $discountedPrice || isItemOwned}
              onclick={() => (isPurchaseDialogOpen = true)}
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

        <Tooltip.Root>
          <Tooltip.Trigger tabindex={-1}>
            <Button
              class="flex w-full items-center justify-center gap-x-2"
              disabled={isSendingGifts ||
                remainingGifts < 1 ||
                ownedVbucks < item.price.final ||
                !item.giftable ||
                !friends.length}
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
