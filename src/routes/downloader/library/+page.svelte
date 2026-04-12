<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import Fuse from 'fuse.js';
  import { t } from '$lib/i18n';
  import { DownloadManager } from '$lib/modules/download.svelte';
  import { Legendary } from '$lib/modules/legendary';
  import { accountStore, downloaderStore } from '$lib/storage';
  import { ownedAppsCache } from '$lib/stores';
  import { handleError } from '$lib/utils';
  import PageContent from '$components/layout/PageContent.svelte';
  import AppCard from '$components/modules/downloader/AppCard.svelte';
  import AppCardSkeleton from '$components/modules/downloader/AppCardSkeleton.svelte';
  import AppFilter from '$components/modules/downloader/AppFilter.svelte';
  import InstallDialog from '$components/modules/downloader/modals/InstallDialog.svelte';
  import UninstallDialog from '$components/modules/downloader/modals/UninstallDialog.svelte';
  import { Input } from '$components/ui/input';
  import type { AppFilterValue } from '$types/legendary';

  // ownedAppsCache is set in autoUpdateApps in +layout.svelte
  const isRefreshing = $derived(!$ownedAppsCache?.length);
  let searchQuery = $state<string>('');
  let filters = $state<AppFilterValue[]>([]);

  let installDialogAppId = $state<string>();
  let uninstallDialogAppId = $state<string>();

  const filteredApps = $derived.by(() => {
    const query = searchQuery.trim().toLowerCase();

    let filtered = Object.values($ownedAppsCache).filter((app) => {
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

      return (
        favoriteA - favoriteB ||
        installedA - installedB ||
        installingA - installingB ||
        inQueueA - inQueueB ||
        a.title.localeCompare(b.title)
      );
    });
  });

  onMount(async () => {
    const isLoggedIn = !!(await Legendary.getAccount());
    if (!isLoggedIn) {
      const toastId = toast.loading($t('library.loggingIn'), { duration: Number.POSITIVE_INFINITY });

      try {
        await Legendary.login(accountStore.getActive()!);
        await Legendary.cacheApps();
        toast.success($t('library.loggedIn'), { id: toastId, duration: 3000 });
      } catch (error) {
        handleError({ error, message: $t('library.failedToLogin'), toastId });
        return;
      }
    }
  });
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'F5') {
      event.preventDefault();
      ownedAppsCache.set([]);
      Legendary.cacheApps();
    }
  }}
/>

<PageContent title={$t('library.page.title')}>
  <div class="flex items-center gap-2">
    <Input
      class="w-full max-w-64 max-xs:max-w-full"
      placeholder={$t('library.searchPlaceholder')}
      type="search"
      bind:value={searchQuery}
    />
    <AppFilter bind:value={filters} />
  </div>

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl-plus:grid-cols-5 2xl:grid-cols-6">
    {#if isRefreshing}
      <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
      {#each Array(8) as _, i (i)}
        <AppCardSkeleton />
      {/each}
    {:else}
      {#each filteredApps as app (app.id)}
        <AppCard appId={app.id} bind:installDialogAppId bind:uninstallDialogAppId />
      {/each}
    {/if}
  </div>

  {#if installDialogAppId}
    <InstallDialog bind:id={installDialogAppId} />
  {/if}

  {#if uninstallDialogAppId}
    <UninstallDialog bind:id={uninstallDialogAppId} />
  {/if}
</PageContent>
