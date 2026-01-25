<script lang="ts" module>
  import type { LegendaryAppInfo } from '$types/legendary';

  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const appInfoCache = new Map<string, LegendaryAppInfo>();
</script>

<script lang="ts">
  import * as Dialog from '$components/ui/dialog';
  import { ownedApps } from '$lib/stores';
  import Legendary from '$lib/utils/epic/legendary';
  import DownloadManager from '$lib/managers/download.svelte.js';
  import { bytesToSize, cn, t } from '$lib/utils';
  import { Progress } from '$components/ui/progress';
  import PackageIcon from '@lucide/svelte/icons/package';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
  import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import DownloadStartedToast from '$components/features/downloader/DownloadStartedToast.svelte';
  import logger from '$lib/utils/logger';
  import { Button, buttonVariants } from '$components/ui/button';
  import { downloaderStore } from '$lib/storage';
  import Tauri from '$lib/utils/tauri';

  type Props = {
    id: string;
  };

  let { id = $bindable() }: Props = $props();

  const app = $ownedApps.find((x) => x.id === id)!;

  let isOpen = $state(true);
  let isStartingDownload = $state(false);

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
      await DownloadManager.addToQueue(app);
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
    const appInfo = appInfoCache.get(app.id) || (await Legendary.getAppInfo(app.id).then((x) => x.stdout))!;

    const diskSpace = await Tauri.getDiskSpace({ dir: downloaderStore.get().downloadPath! })

    appInfoCache.set(app.id, appInfo);

    totalSpace = diskSpace.total;
    availableSpace = diskSpace.available;

    downloadSize = appInfo.manifest.download_size;
    installSize = appInfo.manifest.disk_size;

    app.downloadSize = downloadSize;
    ownedApps.update((current) => {
      return current.map((app) =>
        app.id === id
          ? { ...app, downloadSize }
          : app
      );
    });
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
        <div class="bg-card border rounded-lg p-4">
          <div class="flex items-center gap-2 mb-1">
            <DownloadIcon class="size-6 text-primary"/>
            <span class="font-medium">{$t('library.installConfirmation.downloadSize')}</span>
          </div>

          {#if downloadSize === 0}
            <div class="text-2xl text-muted-foreground skeleton-loader p-4"></div>
          {:else}
            <div class="text-2xl font-bold">{bytesToSize(downloadSize)}</div>
          {/if}
          <div class="text-xs text-muted-foreground">{$t('library.installConfirmation.compressed')}</div>
        </div>

        <div class="bg-card border rounded-lg p-4">
          <div class="flex items-center gap-2 mb-1">
            <PackageIcon class="size-6 text-primary"/>
            <span class="font-medium">{$t('library.installConfirmation.installSize')}</span>
          </div>

          {#if installSize === 0}
            <div class="text-2xl text-muted-foreground skeleton-loader p-4"></div>
          {:else}
            <div class="text-2xl font-bold">{bytesToSize(installSize)}</div>
          {/if}
          <div class="text-xs text-muted-foreground">{$t('library.installConfirmation.afterExtraction')}</div>
        </div>
      </div>

      <div class="bg-card border rounded-lg p-4">
        <div class="flex items-center gap-2 mb-1">
          <HardDriveIcon class="size-6 text-primary"/>
          <span class="font-medium">{$t('library.installConfirmation.storage.title')}</span>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between text-xs">
            <span class="text-muted-foreground">
              {$t('library.installConfirmation.storage.current')}:
              {#if !usedSpace || !totalSpace}
                <span class="skeleton-loader px-5 ml-1 rounded"></span>
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
                <AlertTriangleIcon class="size-4"/>
              {/if}

              {$t('library.installConfirmation.storage.after')}:
              {#if usedSpace === 0 || totalSpace === 0 || installSize === 0}
                <span class="skeleton-loader py-2 px-5 -ml-0.5 rounded"></span>
              {:else}
                {bytesToSize(usedSpace + installSize)} / {bytesToSize(totalSpace)}
              {/if}
            </span>
          </div>

          <Progress class="bg-accent" value={usedPercentage}/>
        </div>
      </div>

      <Dialog.Footer class="flex w-full items-center justify-center gap-2">
        <Dialog.Close class={cn(buttonVariants({ variant: 'secondary' }), "flex-1")}>
          {$t('cancel')}
        </Dialog.Close>

        <Button
          class="flex-1"
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