<script lang="ts">
  import { Button, buttonVariants } from '$components/ui/button';
  import * as Dialog from '$components/ui/dialog';
  import { EpicAPIError } from '$lib/exceptions/EpicAPIError';
  import { language, t } from '$lib/i18n';
  import { MCP } from '$lib/modules/mcp';
  import { accountStore } from '$lib/storage';
  import { accountCacheStore, ownedItemsStore } from '$lib/stores';
  import { calculateDiscountedShopPrice, cn } from '$lib/utils';
  import type { SpitfireShopItem } from '$types/game/shop';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import { toast } from 'svelte-sonner';
  import { derived as jsDerived } from 'svelte/store';

  type Props = {
    item: SpitfireShopItem;
    isPurchasing: boolean;
    open: boolean;
  };

  let { item, isPurchasing, open = $bindable(false) }: Props = $props();

  const activeAccount = accountStore.getActiveStore();
  const discountedPrice = jsDerived(
    [activeAccount, ownedItemsStore],
    ([$activeAccount]) => calculateDiscountedShopPrice($activeAccount.accountId, item),
    0
  );

  async function purchaseItem() {
    isPurchasing = true;

    try {
      const purchaseData = await MCP.purchaseCatalogEntry($activeAccount, item.offerId, $discountedPrice);

      accountCacheStore.update((accounts) => {
        const account = accounts[$activeAccount.accountId];
        account.vbucks = (account.vbucks || 0) - purchaseData.vbucksSpent;
        return accounts;
      });

      ownedItemsStore.update((accounts) => {
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
            accountCacheStore.update((accounts) => {
              const account = accounts[$activeAccount.accountId];
              account.vbucks = Number.parseInt(errorItemPrice);
              return accounts;
            });

            return;
          }
          case 'errors.com.epicgames.modules.gamesubcatalog.purchase_not_allowed': {
            toast.error($t('itemShop.alreadyOwned'));
            ownedItemsStore.update((accounts) => {
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

      <Dialog.Description class="flex flex-wrap items-center gap-1 break-words whitespace-normal">
        {@html $t('itemShop.purchaseConfirmation.description', {
          name: `<span class="font-semibold">${item.name}</span>`,
          price: `<span class="font-semibold">${$discountedPrice.toLocaleString($language)}</span>`,
          vbucksIcon: '<img class="size-5 inline-block" alt="V-Bucks" src="/resources/currency_mtxswap.png"/>'
        })}
      </Dialog.Description>
    </Dialog.Header>

    <Dialog.Footer class="flex w-full items-center justify-center gap-2">
      <Dialog.Close class={cn(buttonVariants({ variant: 'secondary' }), 'flex-1')}>
        {$t('cancel')}
      </Dialog.Close>

      <Button class="flex-1" disabled={isPurchasing} onclick={purchaseItem}>
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
