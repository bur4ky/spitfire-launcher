<script lang="ts">
  import { page } from '$app/state';
  import { MediaQuery } from 'svelte/reactivity';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import CheckIcon from '@lucide/svelte/icons/check';
  import * as DropdownMenu from '$components/ui/dropdown-menu';
  import type { AccountData } from '$types/accounts';
  import { avatarCache } from '$lib/stores';
  import { toast } from 'svelte-sonner';
  import LoginModal from '$components/features/login/LoginModal.svelte';
  import { cn, handleError, t } from '$lib/utils';
  import { Button } from '$components/ui/button';
  import { accountStore } from '$lib/storage';

  type PageState = {
    showLoginModal?: boolean;
  };

  const allAccounts = $derived($accountStore.accounts);
  const activeAccount = accountStore.getActiveStore();

  let dropdownOpen = $state(false);
  let searchTerm = $state<string>();
  let showLoginModal = $state(false);

  let isSmall = new MediaQuery('max-width: 640px');
  let dropdownSide: 'top' | 'right' = $derived(isSmall.current ? 'top' : 'right');

  $effect(() => {
    const pageState = page.state as PageState;
    showLoginModal = pageState.showLoginModal || false;
  });

  const filteredAccounts = $derived(searchTerm
    ? allAccounts.filter((account) => account.displayName.toLowerCase().includes(searchTerm!.toLowerCase()))
    : allAccounts);

  function closeDropdown() {
    dropdownOpen = false;
  }

  async function changeAccounts(account: AccountData) {
    dropdownOpen = false;
    accountStore.setActive(account.accountId);
  }

  function addNewAccount() {
    showLoginModal = true;
  }

  async function logout() {
    const accountName = $activeAccount.displayName || $activeAccount.accountId;
    const toastId = toast.loading($t('accountManager.loggingOut', { name: accountName }));

    try {
      accountStore.remove($activeAccount.accountId);
      toast.success($t('accountManager.loggedOut', { name: accountName }), { id: toastId });
    } catch (error) {
      handleError({
        error,
        message: $t('accountManager.failedToLogout', { name: accountName }),
        toastId,
        account: $activeAccount
      });
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    event.stopPropagation();

    if (event.key === 'Escape') {
      dropdownOpen = false;
    }
  }
</script>

<DropdownMenu.Root bind:open={dropdownOpen}>
  <DropdownMenu.Trigger class="w-full">
    <Button
      class="w-full py-6"
      onclick={closeDropdown}
      variant="ghost"
    >
      <img
        class="size-8 rounded-full"
        alt={$activeAccount.displayName}
        src={avatarCache.get($activeAccount.accountId) || '/misc/default-outfit-icon.png'}
      />

      <span class="text-base font-medium truncate">
        {$activeAccount.displayName || $t('accountManager.noAccount')}
      </span>

      <ChevronDownIcon
        class={cn(
          'size-7 ml-auto transition-transform duration-200 rounded-md p-1',
          dropdownOpen ? dropdownSide === 'right' ? '-rotate-90' : 'rotate-180' : ''
        )}
      />
    </Button>
  </DropdownMenu.Trigger>

  <DropdownMenu.Content class="p-2" side={dropdownSide}>
    {#if allAccounts.length}
      <input
        class="w-full px-3 py-2 text-sm rounded-md bg-input border-input focus:outline-none focus:ring-2 focus:ring-ring"
        onkeydown={handleKeyPress}
        onkeyup={handleKeyPress}
        placeholder={$t('accountManager.searchAccounts')}
        tabindex="-1"
        type="text"
        bind:value={searchTerm}
      />
    {/if}

    {#if filteredAccounts.length}
      <div class="py-2 max-h-64 overflow-y-auto">
        {#each filteredAccounts as account (account.accountId)}
          <DropdownMenu.Item class="duration-0" onclick={() => changeAccounts(account)}>
            <img
              class="size-7 rounded-full"
              alt={account.displayName}
              src={avatarCache.get(account.accountId) || '/misc/default-outfit-icon.png'}
            />

            <span class="truncate">{account.displayName}</span>

            {#if $activeAccount.accountId === account.accountId}
              <CheckIcon class="size-5 ml-auto"/>
            {/if}
          </DropdownMenu.Item>
        {/each}
      </div>
    {/if}

    <div
      class={[
        'space-y-1',
        { 'pt-2': !!allAccounts.length },
        { 'border-t border-border': !!filteredAccounts.length }
      ]}
    >
      <DropdownMenu.Item onclick={addNewAccount}>
        <PlusIcon class="size-4 shrink-0"/>
        <span class="truncate">{$t('accountManager.login')}</span>
      </DropdownMenu.Item>

      {#if $activeAccount}
        <DropdownMenu.Item
          class="hover:bg-destructive hover:text-destructive-foreground"
          onclick={logout}
        >
          <LogOutIcon class="size-4 shrink-0"/>
          <span class="truncate">{$t('accountManager.logout')}</span>
        </DropdownMenu.Item>
      {/if}
    </div>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<LoginModal bind:open={showLoginModal}/>
