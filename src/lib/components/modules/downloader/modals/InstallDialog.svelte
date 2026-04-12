<script lang="ts" module>
  import type { LegendaryAppInfo, LegendarySDLResponse } from '$types/legendary';

  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const appInfoCache = new Map<string, LegendaryAppInfo>();
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
  import BoxesIcon from '@lucide/svelte/icons/boxes';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
  import PackageIcon from '@lucide/svelte/icons/package';
  import { t } from '$lib/i18n';
  import { logger } from '$lib/logger';
  import { DownloadManager } from '$lib/modules/download.svelte.js';
  import { Legendary } from '$lib/modules/legendary';
  import { downloaderStore } from '$lib/storage';
  import { ownedAppsCache } from '$lib/stores';
  import { Tauri } from '$lib/tauri';
  import { bytesToSize, cn } from '$lib/utils';
  import DownloadStartedToast from '$components/modules/downloader/DownloadStartedToast.svelte';
  import { Button, buttonVariants } from '$components/ui/button';
  import * as Dialog from '$components/ui/dialog';
  import { Progress } from '$components/ui/progress';
  import * as Select from '$components/ui/select';

  type Props = {
    id: string;
  };

  let { id = $bindable() }: Props = $props();

  const app = $derived($ownedAppsCache.find((x) => x.id === id)!);

  let isOpen = $state(true);
  let isStartingDownload = $state(false);
  let sdlList = $state<LegendarySDLResponse | null>(null);
  let selectedSDLCategories = $state<string[]>([]);

  let downloadSize = $state(0);
  let installSize = $state(0);
  let totalSpace = $state(0);
  let availableSpace = $state(0);

  const usedSpace = $derived(totalSpace - availableSpace);
  const usedPercentage = $derived((usedSpace / (totalSpace || 1)) * 100);
  const afterInstallPercentage = $derived(((usedSpace + installSize) / (totalSpace || 1)) * 100);

  async function installApp() {
    isStartingDownload = true;

    try {
      const installTags = selectedSDLCategories.flatMap((category) => sdlList?.[category]?.tags || []);
      if (sdlList?.['__required']?.tags) {
        installTags.push(...sdlList['__required'].tags);
      }

      await DownloadManager.addToQueue(app, installTags.filter(Boolean));
      if (DownloadManager.downloadingAppId === app.id) {
        toast.info(DownloadStartedToast);
      }
    } catch (error) {
      logger.error('Failed to start download', { error });
    } finally {
      isStartingDownload = false;
      isOpen = false;
    }
  }

  onMount(async () => {
    const [appInfo, diskSpace, sdlData] = await Promise.all([
      appInfoCache.get(app.id)
        ? Promise.resolve(appInfoCache.get(app.id)!)
        : Legendary.getAppInfo(app.id).then((x) => x.stdout),
      Tauri.getDiskSpace({ dir: downloaderStore.get().downloadPath! }),
      Legendary.getSDLList(app.id).catch(() => null)
    ]);

    sdlList = sdlData;
    appInfoCache.set(app.id, appInfo);

    totalSpace = diskSpace.total;
    availableSpace = diskSpace.available;

    downloadSize = appInfo.manifest.download_size;
    installSize = appInfo.manifest.disk_size;

    app.downloadSize = downloadSize;
    ownedAppsCache.update((current) => current.map((app) => (app.id === id ? { ...app, downloadSize } : app)));
  });
</script>

<Dialog.Root onOpenChangeComplete={(open) => !open && (id = '')} bind:open={isOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        {app.title}
      </Dialog.Title>
    </Dialog.Header>

    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="rounded-lg border bg-card p-4">
          <div class="mb-1 flex items-center gap-2">
            <DownloadIcon class="size-6 text-primary" />
            <span class="font-medium">{$t('library.installConfirmation.downloadSize')}</span>
          </div>

          {#if downloadSize === 0}
            <div class="skeleton-loader p-4 text-2xl text-muted-foreground"></div>
          {:else}
            <div class="text-2xl font-bold">{bytesToSize(downloadSize)}</div>
          {/if}
          <div class="text-xs text-muted-foreground">{$t('library.installConfirmation.compressed')}</div>
        </div>

        <div class="rounded-lg border bg-card p-4">
          <div class="mb-1 flex items-center gap-2">
            <PackageIcon class="size-6 text-primary" />
            <span class="font-medium">{$t('library.installConfirmation.installSize')}</span>
          </div>

          {#if !installSize}
            <div class="skeleton-loader p-4 text-2xl text-muted-foreground"></div>
          {:else}
            <div class="text-2xl font-bold">{bytesToSize(installSize)}</div>
          {/if}
          <div class="text-xs text-muted-foreground">{$t('library.installConfirmation.afterExtraction')}</div>
        </div>
      </div>

      <div class="rounded-lg border bg-card p-4">
        <div class="mb-1 flex items-center gap-2">
          <HardDriveIcon class="size-6 text-primary" />
          <span class="font-medium">{$t('library.installConfirmation.storage.title')}</span>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between text-xs">
            <span class="text-muted-foreground">
              {$t('library.installConfirmation.storage.current')}:
              {#if !usedSpace || !totalSpace}
                <span class="skeleton-loader ml-1 rounded px-5"></span>
              {:else}
                {bytesToSize(usedSpace)} / {bytesToSize(totalSpace)}
              {/if}
            </span>

            <span
              class={cn(
                'flex items-center gap-1.5',
                afterInstallPercentage >= 100
                  ? 'text-red-500'
                  : afterInstallPercentage >= 85
                    ? 'text-yellow-500'
                    : 'text-muted-foreground'
              )}
            >
              {#if afterInstallPercentage >= 85}
                <AlertTriangleIcon class="size-4" />
              {/if}

              {$t('library.installConfirmation.storage.after')}:
              {#if usedSpace === 0 || totalSpace === 0 || installSize === 0}
                <span class="skeleton-loader -ml-0.5 rounded px-5 py-2"></span>
              {:else}
                {bytesToSize(usedSpace + installSize)} / {bytesToSize(totalSpace)}
              {/if}
            </span>
          </div>

          <Progress class="bg-accent" value={usedPercentage} />
        </div>
      </div>

      {#if sdlList}
        <Select.Root allowDeselect={true} type="multiple" bind:value={selectedSDLCategories}>
          <Select.Trigger class="w-full">
            <BoxesIcon class="size-5" />
            {selectedSDLCategories.length
              ? $t('library.installConfirmation.sdl.selected', { count: selectedSDLCategories.length })
              : $t('library.installConfirmation.sdl.title')}
          </Select.Trigger>

          <Select.Content>
            {#each Object.entries(sdlList) as [category, sdl] (category)}
              <Select.Item disabled={category === '__required'} value={category}>
                {sdl.name}
                {#if category === '__required'}
                  ({$t('library.installConfirmation.sdl.required')})
                {/if}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      {/if}

      <Dialog.Footer class="grid w-full grid-cols-2 gap-2">
        <Dialog.Close class={buttonVariants({ variant: 'secondary' })}>
          {$t('cancel')}
        </Dialog.Close>

        <Button
          disabled={!afterInstallPercentage || afterInstallPercentage >= 100 || isStartingDownload}
          loading={isStartingDownload}
          onclick={installApp}
        >
          {$t('library.installConfirmation.download')}
        </Button>
      </Dialog.Footer>
    </div>
  </Dialog.Content>
</Dialog.Root>
