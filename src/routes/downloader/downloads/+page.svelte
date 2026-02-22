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
  <div class="rounded-md border bg-card p-3">
    {#if currentDownload}
      <div class="flex gap-4">
        <img
          class="w-16 rounded object-cover"
          alt={currentDownload.item.title}
          src={currentDownload.item.images.tall}
        />

        <div class="flex flex-1 flex-col gap-4">
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-semibold text-foreground">{currentDownload.item.title}</h2>
            <div class="flex gap-2">
              <Button disabled={isCancelling || isTogglingPause} onclick={togglePause} size="icon-sm" variant="outline">
                {#if isTogglingPause}
                  <LoaderCircleIcon class="animate-spin" />
                {:else if currentDownload.status === 'paused'}
                  <PlayIcon />
                {:else}
                  <PauseIcon />
                {/if}
              </Button>

              <Button
                disabled={isCancelling || isTogglingPause}
                onclick={() => (showCancelDialog = true)}
                size="icon-sm"
                variant="outline"
              >
                {#if isCancelling}
                  <LoaderCircleIcon class="animate-spin" />
                {:else}
                  <XIcon />
                {/if}
              </Button>
            </div>
          </div>

          <div class="mt-auto flex flex-col gap-2">
            <Progress
              indicatorClass={currentDownload.status === 'paused' ? 'bg-yellow-500' : ''}
              value={progress.percent}
            />

            <div class="flex flex-wrap items-center gap-x-4 text-xs text-muted-foreground">
              <span class="flex items-center gap-1">
                <DownloadIcon class="size-4" />
                {bytesToSize(progress.downloadSpeed || 0, 1)}ps
              </span>

              <span class="flex items-center gap-1">
                <HardDriveIcon class="size-4" />
                {bytesToSize(progress.diskWriteSpeed || 0, 1)}ps
              </span>

              <span class="flex items-center gap-1">
                <ClockIcon class="size-4" />
                {formatRemainingDuration(progress.etaMs)}
              </span>

              <span class="ml-auto flex items-center gap-1">
                <span>{bytesToSize(progress.downloaded || 0)} / {bytesToSize(progress.actualDownloadSize || 0)}</span>
                <span>({(progress.percent || 0).toFixed(2)}%)</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <div class="py-10 text-center text-muted-foreground">
        {$t('downloads.noDownloads')}
      </div>
    {/if}
  </div>

  {#if queue.length}
    <div class="w-full rounded-md">
      <h3 class="mb-2 text-sm font-medium tracking-wider text-muted-foreground/60 uppercase">
        {$t('downloads.queued')}
      </h3>
      <div class="space-y-4">
        {#each queue as { item }, index (item.id)}
          <div class="flex items-center gap-4 rounded-lg border bg-card p-3">
            <img class="w-12 rounded object-cover" alt={item.title} src={item.images.tall} />

            <div class="flex-1">
              <h4 class="font-medium">{item.title}</h4>
              <p class="text-sm text-muted-foreground">{bytesToSize(item.downloadSize || item.installSize, 2)}</p>
            </div>

            <div class="flex items-center gap-2">
              <Button
                disabled={index === 0}
                onclick={() => DownloadManager.moveQueueItem(item.id, 'up')}
                size="icon-sm"
                variant="outline"
              >
                <ChevronUpIcon />
              </Button>

              <Button
                disabled={index === queue.length - 1}
                onclick={() => DownloadManager.moveQueueItem(item.id, 'down')}
                size="icon-sm"
                variant="outline"
              >
                <ChevronDownIcon />
              </Button>

              <Button onclick={() => DownloadManager.removeFromQueue(item.id)} size="icon-sm" variant="outline">
                <XIcon />
              </Button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if completed.length}
    <div class="w-full rounded-md">
      <h3 class="mb-2 text-sm font-medium tracking-wider text-muted-foreground/60 uppercase">
        {$t('downloads.completed')}
      </h3>
      <div class="space-y-4">
        {#each completed as { status, item, completedAt } (item.id)}
          <div class="flex items-center gap-4 rounded-lg border bg-card p-3">
            <img class="w-12 rounded object-cover" alt={item.title} src={item.images.tall} />

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
              <Button onclick={() => DownloadManager.removeFromQueue(item.id)} size="icon-sm" variant="outline">
                <XIcon />
              </Button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <CancelDownloadDialog onConfirm={cancelDownload} bind:open={showCancelDialog} />
</PageContent>
