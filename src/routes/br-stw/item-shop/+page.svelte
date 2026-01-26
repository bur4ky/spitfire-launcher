<script lang="ts" module>
  import type { SpitfireShopFilter } from '$types/game/shop';

  let searchQuery = $state<string>('');
  let selectedFilters = $state<SpitfireShopFilter[]>([]);
</script>

<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import ShopItemModal from '$components/modules/shop/modals/ShopItemModal.svelte';
  import ShopFilter from '$components/modules/shop/ShopFilter.svelte';
  import ShopSection from '$components/modules/shop/ShopSection.svelte';
  import SkeletonShopSection from '$components/modules/shop/skeletons/SkeletonShopSection.svelte';
  import { Input } from '$components/ui/input';
  import Friends from '$lib/modules/friends';
  import Lookup from '$lib/modules/lookup';
  import MCP from '$lib/modules/mcp';
  import Shop from '$lib/modules/shop';
  import { accountDataStore, brShopStore, ownedItemsStore } from '$lib/stores';
  import { calculateVbucks, formatRemainingDuration, handleError, t } from '$lib/utils';
  import type { AccountStoreData } from '$types/accounts';
  import type { SpitfireShopSection } from '$types/game/shop';
  import Fuse from 'fuse.js';
  import { onMount } from 'svelte';
  import logger from '$lib/logger';
  import { accountStore } from '$lib/storage';

  const activeAccount = accountStore.getActiveStore(true);

  $effect(() => {
    const alreadyFetched = $activeAccount && Object.keys($accountDataStore[$activeAccount.accountId] || {}).length;
    if (!$activeAccount || alreadyFetched) return;

    fetchAccountData();
  });

  let remainingTime = $state(getResetDate().getTime() - Date.now());
  let shopSections = $state<SpitfireShopSection[] | null>(null);
  let errorOccurred = $state(false);
  let modalOfferId = $state<string>('');

  const filteredSections = $derived.by(() => {
    if (!shopSections) return null;

    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const longestWaitMs = 120 * 24 * 60 * 60 * 1000;

    return shopSections
      .map((section) => {
        let items = section.items;

        if (selectedFilters.includes('new')) {
          items = items.filter((item) => !item.dates.lastSeen || item.shopHistory.length < 2);
        }

        if (selectedFilters.includes('leavingSoon')) {
          items = items.filter((item) => item.dates.out && new Date(item.dates.out).getTime() - now < threeDaysMs);
        }

        if (selectedFilters.includes('longestWait')) {
          items = items.filter((item) => item.dates.lastSeen && now - new Date(item.dates.lastSeen).getTime() > longestWaitMs);
        }

        if (searchQuery && items.length) {
          const fuse = new Fuse(items, { keys: ['name'], threshold: 0.4, shouldSort: false });
          items = fuse.search(searchQuery).map((result) => result.item);
        }

        return { ...section, items };
      })
      .filter((section) => section.items.length);
  });

  async function fetchShop(forceRefresh = false) {
    shopSections = null;

    try {
      const response = (!forceRefresh && $brShopStore) || await Shop.fetch();
      shopSections = Shop.groupBySections(response.offers).map((section) => ({
        ...section,
        items: section.items.sort((a, b) => b.sortPriority - a.sortPriority)
      }));
    } catch (error) {
      logger.error('Failed to fetch BR shop data', { error });
      errorOccurred = true;
    }
  }

  async function fetchAccountData() {
    const account = $activeAccount!;
    const [athena, commonCore, friends] = await Promise.allSettled([
      MCP.queryProfile(account, 'athena'),
      MCP.queryProfile(account, 'common_core'),
      Friends.getFriends(account)
    ]);

    let accountData: AccountStoreData = {
      vbucks: 0,
      remainingGifts: 0,
      friends: []
    };

    if (athena.status === 'fulfilled') {
      const profile = athena.value.profileChanges[0].profile;
      const items = Object.values(profile.items);
      const ownedItems = items.filter((item) => item.attributes.item_seen != null).map((item) => item.templateId.split(':')[1].toLowerCase());

      ownedItemsStore.update((accounts) => {
        accounts[account.accountId] = new Set<string>(ownedItems);
        return accounts;
      });
    } else {
      handleError({ error: athena.reason, message: 'Failed to fetch Athena profile', account, toastId: false })
    }

    if (commonCore.status === 'fulfilled') {
      const profile = commonCore.value.profileChanges[0].profile;
      accountData.vbucks = calculateVbucks(commonCore.value);
      accountData.remainingGifts = profile.stats.attributes.allowed_to_send_gifts ? 5 : 0;
    } else {
      handleError({ error: commonCore.reason, message: 'Failed to fetch Common Core profile', account, toastId: false });
    }

    if (friends.status === 'fulfilled') {
      const accountsData = await Lookup.fetchByIds(account, friends.value.map((friend) => friend.accountId));

      accountData.friends = accountsData
        .sort((a, b) => (a.displayName || a.id).localeCompare(b.displayName || b.id))
        .map((account) => ({
          displayName: account.displayName || account.id,
          accountId: account.id
        }));
    } else {
      handleError({ error: friends.reason, message: 'Failed to fetch friends list', account, toastId: false });
    }

    if (commonCore.status === 'fulfilled' || friends.status === 'fulfilled') {
      accountDataStore.update((accounts) => {
        accounts[account.accountId] = accountData;
        return accounts;
      });
    }
  }

  function getResetDate() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const day = now.getUTCDate();

    return new Date(Date.UTC(year, month, day + 1));
  }

  onMount(() => {
    let isFetching = true;
    fetchShop().finally(() => isFetching = false);

    let intervalId = setInterval(() => {
      const nextResetDate = getResetDate();
      remainingTime = nextResetDate.getTime() - Date.now();

      if (Date.now() > nextResetDate.getTime() && !isFetching) {
        isFetching = true;
        fetchShop(true).finally(() => {
          isFetching = false;
        });
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  });
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'F5') {
      event.preventDefault();
      errorOccurred = false;
      fetchShop(true);
    }
  }}
/>

<PageContent
  class="mt-2"
  description={remainingTime ? $t('itemShop.nextRotation', { time: formatRemainingDuration(remainingTime) }) : undefined}
  title={$t('itemShop.page.title')}
>
  <div class="flex max-xs:flex-col items-center gap-2">
    <Input
      class="max-w-64 max-xs:max-w-full w-full"
      placeholder={$t('itemShop.searchPlaceholder')}
      type="search"
      bind:value={searchQuery}
    />
    <ShopFilter bind:value={selectedFilters}/>
  </div>

  <div class="mt-4">
    {#if !filteredSections}
      {#if errorOccurred}
        <p class="text-red-500">{$t('itemShop.failedtoFetch')}</p>
      {:else}
        <div class="space-y-9">
          <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
          {#each Array(2) as _, index (index)}
            <SkeletonShopSection/>
          {/each}
        </div>
      {/if}
    {:else if filteredSections?.length}
      <div class="space-y-9">
        {#each filteredSections as section (section.name)}
          <ShopSection {section} bind:modalOfferId/>
        {/each}
      </div>
    {:else}
      <p>{$t('itemShop.noItems')}</p>
    {/if}
  </div>

  {#if modalOfferId}
    <ShopItemModal bind:offerId={modalOfferId}/>
  {/if}
</PageContent>
