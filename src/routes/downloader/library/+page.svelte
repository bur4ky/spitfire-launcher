<script lang="ts">
  import AppCard from '$components/modules/downloader/AppCard.svelte';
  import AppFilter from '$components/modules/downloader/AppFilter.svelte';
  import InstallDialog from '$components/modules/downloader/modals/InstallDialog.svelte';
  import SkeletonAppCard from '$components/modules/downloader/skeletons/SkeletonAppCard.svelte';
  import UninstallDialog from '$components/modules/downloader/modals/UninstallDialog.svelte';
  import PageContent from '$components/layout/PageContent.svelte';
  import { Input } from '$components/ui/input';
  import { ownedApps } from '$lib/stores';
  import Legendary from '$lib/modules/legendary';
  import DownloadManager from '$lib/modules/download.svelte';
  import { handleError, t } from '$lib/utils';
  import type { AppFilterValue } from '$types/legendary';
  import Fuse from 'fuse.js';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { accountStore, downloaderStore } from '$lib/storage';

  let isRefreshing = $state(false);
  let searchQuery = $state<string>('');
  let filters = $state<AppFilterValue[]>([]);

  let installDialogAppId = $state<string>();
  let uninstallDialogAppId = $state<string>();

  const filteredApps = $derived.by(() => {
    const query = searchQuery.trim().toLowerCase();

    let filtered = Object.values($ownedApps).filter((app) => {
      if (!filters.includes('hidden') && $downloaderStore.hiddenApps?.includes(app.id)) return false;
      if (filters.includes('installed') && !app.installed) return false;
      if (filters.includes('updatesAvailable') && !app.hasUpdate) return false;
      return true;
    });

    if (query) {
      const fuse = new Fuse(filtered, {
        keys: ['title'],
        threshold: 0.4
      });

      filtered = fuse.search(query).map((result) => result.item);
    }

    return filtered.sort((a, b) => {
      const favoriteA = $downloaderStore.favoriteApps?.includes(a.id) ? 0 : 1;
      const favoriteB = $downloaderStore.favoriteApps?.includes(b.id) ? 0 : 1;

      const installedA = a.installed ? 0 : 1;
      const installedB = b.installed ? 0 : 1;

      const installingA = DownloadManager.downloadingAppId === a.id ? 0 : 1;
      const installingB = DownloadManager.downloadingAppId === b.id ? 0 : 1;

      const inQueueA = DownloadManager.isInQueue(a.id) ? 0 : 1;
      const inQueueB = DownloadManager.isInQueue(b.id) ? 0 : 1;

      return favoriteA - favoriteB
        || installedA - installedB
        || installingA - installingB
        || inQueueA - inQueueB
        || a.title.localeCompare(b.title);
    });
  });

  onMount(async () => {
    isRefreshing = true;

    const isLoggedIn = (await Legendary.getStatus()).account;
    if (!isLoggedIn) {
      const toastId = toast.loading($t('library.loggingIn'), { duration: Number.POSITIVE_INFINITY });

      try {
        await Legendary.login(accountStore.getActive()!);
        toast.success($t('library.loggedIn'), { id: toastId, duration: 3000 });
      } catch (error) {
        isRefreshing = false;
        handleError({ error, message: $t('library.failedToLogin'), toastId });
        return;
      }
    }

    await Legendary.cacheApps().finally(() => {
      isRefreshing = false;
    });
  });
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'F5') {
      event.preventDefault();
      isRefreshing = true;
      Legendary.cacheApps(true).finally(() => {
        isRefreshing = false;
      });
    }
  }}
/>

<PageContent title={$t('library.page.title')}>
  <div class="flex items-center gap-2">
    <Input
      class="max-w-64 max-xs:max-w-full w-full"
      placeholder={$t('library.searchPlaceholder')}
      type="search"
      bind:value={searchQuery}
    />
    <AppFilter bind:value={filters}/>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {#if isRefreshing}
      <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
      {#each Array(8) as _, i (i)}
        <SkeletonAppCard/>
      {/each}
    {:else}
      {#each filteredApps as app (app.id)}
        <AppCard
          appId={app.id}
          bind:installDialogAppId
          bind:uninstallDialogAppId
        />
      {/each}
    {/if}
  </div>

  {#if installDialogAppId}
    <InstallDialog bind:id={installDialogAppId}/>
  {/if}

  {#if uninstallDialogAppId}
    <UninstallDialog bind:id={uninstallDialogAppId}/>
  {/if}
</PageContent>