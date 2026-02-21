<script lang="ts" module>
  let isLoading = $state(false);
  let isSendingRequest = $state(false);
</script>

<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import FriendsList, { type ListType } from '$components/modules/friends/FriendsList.svelte';
  import FriendCardSkeleton from '$components/modules/friends/FriendCardSkeleton.svelte';
  import { Button } from '$components/ui/button';
  import * as Tabs from '$components/ui/tabs';
  import { Friends } from '$lib/modules/friends';
  import { Lookup } from '$lib/modules/lookup';
  import { XMPPManager } from '$lib/modules/xmpp';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import UserPlusIcon from '@lucide/svelte/icons/user-plus';
  import { friendsStore } from '$lib/stores';
  import InputWithAutocomplete from '$components/ui/InputWithAutocomplete.svelte';
  import { handleError } from '$lib/utils';
  import { t } from '$lib/i18n';
  import { toast } from 'svelte-sonner';
  import { untrack } from 'svelte';
  import { accountStore } from '$lib/storage';

  const activeAccount = accountStore.getActiveStore();

  type Tab = {
    id: ListType;
    name: string;
    count: number;
  };

  const tabs = $derived([
    getTab('friends'),
    getTab('incoming'),
    getTab('outgoing'),
    getTab('blocklist')
  ] satisfies Tab[]);

  // svelte-ignore state_referenced_locally
  let activeTab = $state(tabs[0].id as ListType);
  let searchQuery = $state<string>();

  function getTab(listType: ListType): Tab {
    const list = friendsStore.get($activeAccount.accountId)?.[listType];

    return {
      id: listType,
      name: $t(`friendsManagement.lists.${listType}`),
      count: list?.size || 0
    };
  }

  async function searchAndAdd(event: SubmitEvent) {
    event.preventDefault();

    if (!searchQuery) return;

    isSendingRequest = true;

    try {
      const lookupData = await Lookup.fetchByNameOrId($activeAccount, searchQuery);

      try {
        await Friends.addFriend($activeAccount, lookupData.accountId);
        searchQuery = '';
        toast.success($t('friendsManagement.sentFriendRequest'));
      } catch (error) {
        handleError({
          error,
          message: $t('friendsManagement.failedToAdd'),
          account: $activeAccount
        });
      }
    } catch (error) {
      handleError({ error, message: $t('lookupPlayers.notFound'), account: $activeAccount });
    } finally {
      isSendingRequest = false;
    }
  }

  $effect(() => {
    untrack(() => {
      if (!friendsStore.get($activeAccount.accountId)?.[activeTab]?.size) {
        isLoading = true;
      }
    });

    Friends.getSummary($activeAccount).finally(() => {
      isLoading = false;
    });

    XMPPManager.new($activeAccount, 'friends').then((xmpp) => {
      xmpp.connect();
    });
  });
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'F5') {
      event.preventDefault();
      isLoading = true;
      Friends.getSummary($activeAccount).finally(() => {
        isLoading = false;
      });
    }
  }}
/>

<PageContent title={$t('friendsManagement.page.title')}>
  <form class="flex items-center gap-x-2" onsubmit={searchAndAdd}>
    <InputWithAutocomplete
      disabled={isLoading}
      placeholder={$t('lookupPlayers.search')}
      type="search"
      bind:value={searchQuery}
    />

    <Button
      class="p-2"
      disabled={isLoading || isSendingRequest || !searchQuery || searchQuery.length < 3}
      title={$t('friendsManagement.sendFriendRequest')}
      type="submit"
    >
      {#if isSendingRequest}
        <LoaderCircleIcon class="size-5 animate-spin" />
      {:else}
        <UserPlusIcon class="size-5" />
      {/if}
    </Button>
  </form>

  <div>
    <Tabs.Root class="mb-4" bind:value={activeTab}>
      <Tabs.List>
        {#each tabs as tab (tab.id)}
          <Tabs.Trigger disabled={!tab.count} value={tab.id}>
            {tab.name}
            {#if tab.count}
              <span
                class="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium"
              >
                {tab.count}
              </span>
            {/if}
          </Tabs.Trigger>
        {/each}
      </Tabs.List>
    </Tabs.Root>

    {#if isLoading}
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div class="hidden sm:contents">
          <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
          {#each Array(12) as _, index (index)}
            <FriendCardSkeleton />
          {/each}
        </div>

        <div class="hidden not-sm:contents">
          <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
          {#each Array(6) as _, index (index)}
            <FriendCardSkeleton />
          {/each}
        </div>
      </div>
    {:else}
      <FriendsList listType={activeTab} bind:searchQuery />
    {/if}
  </div>
</PageContent>
