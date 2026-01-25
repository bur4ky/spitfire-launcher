<script lang="ts">
  import * as Dialog from '$components/ui/dialog';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import GiftIcon from '@lucide/svelte/icons/gift';
  import { accountDataStore } from '$lib/stores';
  import { cn, t } from '$lib/utils';
  import { toast } from 'svelte-sonner';
  import type { SpitfireShopItem } from '$types/game/shop';
  import MCPManager from '$lib/managers/mcp';
  import type { AccountStoreData } from '$types/accounts';
  import EpicAPIError from '$lib/exceptions/EpicAPIError';
  import { Button, buttonVariants } from '$components/ui/button';
  import AccountCombobox from '$components/ui/AccountCombobox.svelte';
  import { accountStore, language } from '$lib/storage';

  type Props = {
    item: SpitfireShopItem;
    isSendingGifts: boolean;
    open: boolean;
  };

  let { item, isSendingGifts, open = $bindable(false) }: Props = $props();

  const activeAccount = accountStore.getActiveStore();
  const {
    vbucks: ownedVbucks = 0,
    friends = []
  } = $derived<AccountStoreData>($accountDataStore[$activeAccount.accountId] || {});

  let selectedFriends = $state<string[]>([]);

  async function sendGifts() {
    isSendingGifts = true;

    try {
      const giftData = await MCPManager.giftCatalogEntry($activeAccount, item.offerId, selectedFriends, item.price.final);
      accountDataStore.update((accounts) => {
        const account = accounts[$activeAccount.accountId];
        account.remainingGifts = (account.remainingGifts || 0) - selectedFriends.length;
        account.vbucks = (account.vbucks || 0) - giftData.vbucksSpent;

        return accounts;
      });

      toast.success($t('itemShop.sentGift'));
    } catch (error) {
      if (error instanceof EpicAPIError) {
        switch (error.errorCode) {
          case 'errors.com.epicgames.modules.gamesubcatalog.gift_limit_reached': {
            toast.error($t('itemShop.reachedDailyGiftLimit'));
            accountDataStore.update((accounts) => {
              const account = accounts[$activeAccount.accountId];
              account.remainingGifts = 0;
              return accounts;
            });

            return;
          }
          case 'errors.com.epicgames.modules.gameplayutils.not_enough_mtx': {
            const [, errorItemPrice, errorOwnedVbucks] = error.messageVars;

            toast.error($t('itemShop.needMoreVbucksToGift', { amount: Number.parseInt(errorItemPrice) - Number.parseInt(errorOwnedVbucks) }));
            accountDataStore.update((accounts) => {
              const account = accounts[$activeAccount.accountId];
              account.vbucks = Number.parseInt(errorItemPrice);
              return accounts;
            });

            return;
          }
          case 'errors.com.epicgames.modules.gamesubcatalog.purchase_not_allowed': {
            return toast.error($t('itemShop.friendsMayOwnItem'));
          }
          case 'errors.com.epicgames.modules.gamesubcatalog.gift_recipient_not_eligible': {
            return toast.error($t('itemShop.friendsNotEligible'));
          }
          case 'errors.com.epicgames.modules.gamesubcatalog.receiver_owns_item_from_bundle': {
            return toast.error($t('itemShop.friendsOwnItemFromBundle'));
          }
          default: {
            if (error.errorMessage.toLowerCase().includes('mfa')) {
              return toast.error($t('itemShop.enableMFA'));
            }

            if (error.messageVars?.[0] === 'errors.com.epicgames.modules.gamesubcatalog.receiver_will_not_accept_gifts') {
              return toast.error($t('itemShop.friendsDoNotAcceptGifts'));
            }
          }
        }
      }

      toast.error($t('itemShop.failedToGift'));
    } finally {
      isSendingGifts = false;
      open = false;
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        {$t('itemShop.giftConfirmation.title')}
      </Dialog.Title>
  
      <Dialog.Description class="flex flex-wrap items-center gap-1 break-words whitespace-normal">
        {@html $t('itemShop.giftConfirmation.description', {
          name: `<span class="font-semibold">${item.name}</span>`,
          price: `<span class="font-semibold">${(item.price.final * (selectedFriends.length || 1)).toLocaleString($language)}</span>`,
          vbucksIcon: '<img class="size-5 inline-block" alt="V-Bucks" src="/resources/currency_mtxswap.png"/>'
        })}
      </Dialog.Description>
    </Dialog.Header>

    <AccountCombobox
      customList={friends}
      disabled={!friends?.length}
      type="multiple"
      bind:value={selectedFriends}
    >
    </AccountCombobox>
  
    <Dialog.Footer class="flex w-full items-center justify-center gap-2">
      <Dialog.Close class={cn(buttonVariants({ variant: 'secondary' }), "flex-1")}>
        {$t('cancel')}
      </Dialog.Close>

      <Button
        class="flex items-center gap-2 flex-1"
        disabled={!selectedFriends.length ||
          isSendingGifts ||
          ownedVbucks < item.price.final * (selectedFriends.length || 1)}
        onclick={sendGifts}
      >
        {#if isSendingGifts}
          <LoaderCircleIcon class="size-5 animate-spin"/>
          {$t('itemShop.sendingGift')}
        {:else}
          <GiftIcon class="size-5"/>
          {$t('itemShop.sendGift')}
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
