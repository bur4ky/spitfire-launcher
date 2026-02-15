<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import CancelDownloadDialog from '$components/modules/downloader/modals/CancelDownloadDialog.svelte';
  import { Button } from '$components/ui/button';
  import { Progress } from '$components/ui/progress';
  import * as Tooltip from '$components/ui/tooltip';
  import { language, t } from '$lib/i18n';
  import { logger } from '$lib/logger';
  import { DownloadManager, type DownloadProgress } from '$lib/modules/download.svelte';
  import { bytesToSize, formatRemainingDuration } from '$lib/utils';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import PauseIcon from '@lucide/svelte/icons/pause';
  import PlayIcon from '@lucide/svelte/icons/play';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import XIcon from '@lucide/svelte/icons/x';

  let showCancelDialog = $state(false);
  let isCancelling = $state(false);
  let isTogglingPause = $state(false);

  const currentDownload = $derived(
    DownloadManager.queue.find(({ item }) => item.id === DownloadManager.downloadingAppId)
  );
  const queue = $derived(DownloadManager.queue.filter((item) => item.status === 'queued'));
  const completed = $derived(
    DownloadManager.queue.filter((item) => item.status === 'completed' || item.status === 'failed')
  );
  const progress = $derived(DownloadManager.progress as DownloadProgress);

  async function togglePause() {
    if (!currentDownload) return;

    isTogglingPause = true;

    try {
      if (currentDownload.status === 'paused') {
        await DownloadManager.resumeDownload();
      } else {
        await DownloadManager.pauseDownload();
      }
    } catch (error) {
      logger.error('Failed to toggle pause state', { error });
    } finally {
      isTogglingPause = false;
    }
  }

  async function cancelDownload() {
    if (!currentDownload) return;

    isCancelling = true;

    try {
      await DownloadManager.removeFromQueue(currentDownload.item.id);
    } catch (error) {
      logger.error('Failed to cancel download', { error });
    } finally {
      isCancelling = false;
    }
  }
</script>

<PageContent title={$t('downloads.page.title')}>
  <div class="relative h-36 w-full rounded-md border p-3 {!currentDownload && 'bg-card'}">
    {#if currentDownload}
      <img
        class="pointer-events-none absolute inset-0 size-full rounded-md object-cover opacity-10"
        alt="Background"
        src={currentDownload.item.images.wide}
      />

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">{currentDownload.item.title}</h3>
          <div class="flex items-center gap-2">
            <Button
              class="p-2"
              disabled={isCancelling || isTogglingPause}
              onclick={togglePause}
              size="sm"
              variant="outline"
            >
              {#if isTogglingPause}
                <LoaderCircleIcon class="size-4 animate-spin" />
              {:else if currentDownload.status === 'paused'}
                <PlayIcon class="size-4" />
              {:else}
                <PauseIcon class="size-4" />
              {/if}
            </Button>
            <Button
              class="p-2"
              disabled={isCancelling || isTogglingPause}
              onclick={() => (showCancelDialog = true)}
              size="sm"
              variant="outline"
            >
              {#if isCancelling}
                <LoaderCircleIcon class="size-4 animate-spin" />
              {:else}
                <XIcon class="size-4" />
              {/if}
            </Button>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-end space-x-2 text-sm">
            <span>{bytesToSize(progress.downloaded)} / {bytesToSize(progress.actualDownloadSize)}</span>
            <span class="text-muted-foreground">/</span>
            <span>{(progress.percent || 0).toFixed(2)}%</span>
          </div>

          <Progress class="bg-accent" value={progress.percent || 0} />

          <div class="flex items-center justify-between text-sm text-muted-foreground">
            <div class="flex items-center gap-2">
              <span class="flex items-center gap-1">
                <DownloadIcon class="size-4" />
                {bytesToSize(progress.downloadSpeed, 1)}ps
              </span>
              <span class="flex items-center gap-1 border-l pl-2">
                <HardDriveIcon class="size-4" />
                {bytesToSize(progress.diskWriteSpeed, 1)}ps
              </span>
            </div>

            <span class="flex items-center gap-1">
              {#if currentDownload.status === 'paused'}
                Paused
              {:else}
                <ClockIcon class="size-4" />
                {formatRemainingDuration(progress.etaMs)}
              {/if}
            </span>
          </div>
        </div>
      </div>
    {:else}
      <div class="flex h-full items-center justify-center">
        <p class="text-muted-foreground">
          {$t('downloads.noDownloads')}
        </p>
      </div>
    {/if}
  </div>

  {#if queue.length}
    <div class="mt-2 w-full rounded-md border p-4">
      <h3 class="mb-4 text-2xl font-semibold">{$t('downloads.queued')}</h3>
      <div class="space-y-4">
        {#each queue as { item }, index (item.id)}
          <div class="flex items-center gap-4 rounded-lg border bg-card p-3">
            <img class="h-16 w-12 rounded object-cover" alt={item.title} src={item.images.tall} />

            <div class="flex-1">
              <h4 class="font-medium">{item.title}</h4>
              <p class="text-sm text-muted-foreground">{bytesToSize(item.downloadSize || item.installSize, 2)}</p>
            </div>

            <div class="flex items-center gap-2">
              <Button
                class="p-2"
                disabled={index === 0}
                onclick={() => DownloadManager.moveQueueItem(item.id, 'up')}
                size="sm"
                variant="outline"
              >
                <ChevronUpIcon class="size-4" />
              </Button>

              <Button
                class="p-2"
                disabled={index === queue.length - 1}
                onclick={() => DownloadManager.moveQueueItem(item.id, 'down')}
                size="sm"
                variant="outline"
              >
                <ChevronDownIcon class="size-4" />
              </Button>

              <Button class="p-2" onclick={() => DownloadManager.removeFromQueue(item.id)} size="sm" variant="outline">
                <XIcon class="size-4" />
              </Button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if completed.length}
    <div class="mt-2 w-full rounded-md border p-4">
      <div class="mb-4 flex items-center gap-2">
        <h3 class="text-2xl font-semibold">{$t('downloads.completed')}</h3>
        <Button onclick={() => DownloadManager.clearCompleted()} size="sm" variant="outline">
          {$t('downloads.clearAll')}
        </Button>
      </div>
      <div class="space-y-4">
        {#each completed as { status, item, completedAt } (item.id)}
          <div class="flex items-center gap-4 rounded-lg border bg-card p-3">
            <img class="h-16 w-12 rounded object-cover" alt={item.title} src={item.images.tall} />

            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h4 class="font-medium">{item.title}</h4>
                {#if status === 'failed'}
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      <TriangleAlertIcon class="size-4 text-red-500" />
                    </Tooltip.Trigger>

                    <Tooltip.Content>
                      {$t('downloads.downloadFailed')}
                    </Tooltip.Content>
                  </Tooltip.Root>
                {/if}
              </div>
              <p class="text-sm text-muted-foreground">{new Date(completedAt || 0).toLocaleString($language)}</p>
            </div>

            <div class="flex items-center gap-2">
              <Button onclick={() => DownloadManager.removeFromQueue(item.id)} variant="outline">
                <XIcon class="size-4" />
              </Button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <CancelDownloadDialog onConfirm={cancelDownload} bind:open={showCancelDialog} />
</PageContent>
