<script lang="ts">
  import { toast } from 'svelte-sonner';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import { EpicAPIError } from '$lib/exceptions/EpicAPIError';
  import { language, t } from '$lib/i18n';
  import { MCP } from '$lib/modules/mcp';
  import { accountStore } from '$lib/storage';
  import { accountDataCache, createDiscountedStore, ownedItemsCache } from '$lib/stores';
  import { Button, buttonVariants } from '$components/ui/button';
  import * as Dialog from '$components/ui/dialog';
  import type { SpitfireShopItem } from '$types/game/shop';

  type Props = {
    item: SpitfireShopItem;
    isPurchasing: boolean;
    open: boolean;
  };

  let { item, isPurchasing, open = $bindable(false) }: Props = $props();

  const activeAccount = accountStore.getActiveStore();
  const discountedPrice = $derived(createDiscountedStore($activeAccount.accountId, item));
  const dataCache = $derived(accountDataCache.get($activeAccount.accountId) || {});

  async function purchaseItem() {
    isPurchasing = true;

    try {
      const purchaseData = await MCP.purchaseCatalogEntry($activeAccount, item.offerId, $discountedPrice);

      accountDataCache.set($activeAccount.accountId, {
        ...dataCache,
        vbucks: (dataCache.vbucks || 0) - purchaseData.vbucksSpent
      });

      ownedItemsCache.update((accounts) => {
        // eslint-disable-next-line svelte/prefer-svelte-reactivity
        const items = accounts[$activeAccount.accountId] || new Set<string>();
        items.add(item.offerId);

        accounts[$activeAccount.accountId] = items;
        return accounts;
      });

      toast.success($t('itemShop.purchased'));
    } catch (error) {
      if (error instanceof EpicAPIError) {
        switch (error.errorCode) {
          case 'errors.com.epicgames.modules.gameplayutils.not_enough_mtx': {
            const [, errorItemPrice, errorOwnedVbucks] = error.messageVars;

            toast.error(
              $t('itemShop.needMoreVbucksToPurchase', {
                amount: Number.parseInt(errorItemPrice) - Number.parseInt(errorOwnedVbucks)
              })
            );
            accountDataCache.set($activeAccount.accountId, {
              ...dataCache,
              vbucks: Number.parseInt(errorItemPrice)
            });

            return;
          }
          case 'errors.com.epicgames.modules.gamesubcatalog.purchase_not_allowed': {
            toast.error($t('itemShop.alreadyOwned'));
            ownedItemsCache.update((accounts) => {
              // eslint-disable-next-line svelte/prefer-svelte-reactivity
              const items = accounts[$activeAccount.accountId] || new Set<string>();
              items.add(item.offerId);

              accounts[$activeAccount.accountId] = items;
              return accounts;
            });

            return;
          }
        }
      }

      toast.error($t('itemShop.failedToPurchase'));
    } finally {
      isPurchasing = false;
      open = false;
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        {$t('itemShop.purchaseConfirmation.title')}
      </Dialog.Title>

      <Dialog.Description class="flex flex-wrap items-center gap-1 wrap-break-word whitespace-normal">
        {@html $t('itemShop.purchaseConfirmation.description', {
          name: `<span class="font-semibold">${item.name}</span>`,
          price: `<span class="font-semibold">${$discountedPrice.toLocaleString($language)}</span>`,
          vbucksIcon: '<img class="size-5 inline-block" alt="V-Bucks" src="/resources/currency_mtxswap.png"/>'
        })}
      </Dialog.Description>
    </Dialog.Header>

    <Dialog.Footer class="grid w-full grid-cols-2 gap-2">
      <Dialog.Close class={buttonVariants({ variant: 'secondary' })}>
        {$t('cancel')}
      </Dialog.Close>

      <Button disabled={isPurchasing} onclick={purchaseItem}>
        {#if isPurchasing}
          <LoaderCircleIcon class="mr-2 size-5 animate-spin" />
          {$t('itemShop.purchasing')}
        {:else}
          {$t('confirm')}
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
