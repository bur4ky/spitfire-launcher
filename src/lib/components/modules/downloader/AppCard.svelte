<script lang="ts">
  import { Button } from '$components/ui/button';
  import AppDropdown from '$components/modules/downloader/AppDropdown.svelte';
  import { t } from '$lib/i18n';
  import { DownloadManager } from '$lib/modules/download.svelte.js';
  import { Legendary } from '$lib/modules/legendary';
  import { downloaderStore } from '$lib/storage';
  import { ownedApps, runningAppIds } from '$lib/stores';
  import { Tauri } from '$lib/tauri';
  import { bytesToSize, handleError, sleep } from '$lib/utils';
  import CircleMinusIcon from '@lucide/svelte/icons/circle-minus';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import EyeOffIcon from '@lucide/svelte/icons/eye-off';
  import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
  import HeartIcon from '@lucide/svelte/icons/heart';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import PlayIcon from '@lucide/svelte/icons/play';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import WrenchIcon from '@lucide/svelte/icons/wrench';
  import XIcon from '@lucide/svelte/icons/x';
  import { toast } from 'svelte-sonner';

  type Props = {
    appId: string;
    installDialogAppId?: string;
    uninstallDialogAppId?: string;
  };

  let { appId, installDialogAppId = $bindable(), uninstallDialogAppId = $bindable() }: Props = $props();

  const app = $derived($ownedApps.find((x) => x.id === appId)!);
  const isInstalling = $derived(DownloadManager.downloadingAppId === app.id);
  const isFavorited = $derived($downloaderStore.favoriteApps?.includes(app.id) ?? false);
  const isHidden = $derived($downloaderStore.hiddenApps?.includes(app.id) ?? false);

  let dropdownOpen = $state(false);
  let isLaunching = $state(false);
  let isStopping = $state(false);
  let isDeleting = $state(false);
  let isVerifying = $state(false);

  async function launchApp() {
    isLaunching = true;

    try {
      await Legendary.launch(app.id);
    } catch (error) {
      handleError({ error, message: $t('library.app.failedToLaunch', { name: app.title }) });
    } finally {
      isLaunching = false;
    }
  }

  async function stopApp() {
    isStopping = true;

    try {
      await Tauri.stopApp({ appId: app.id });
      toast.success($t('library.app.stopped', { name: app.title }));
    } catch (error) {
      handleError({ error, message: $t('library.app.failedToStop', { name: app.title }) });
    } finally {
      // A delay to ensure the app was killed properly
      await sleep(2000);
      isStopping = false;
    }
  }

  async function toggleFavorite() {
    downloaderStore.set((current) => {
      current.favoriteApps ??= [];

      if (current.favoriteApps.includes(app.id)) {
        current.favoriteApps = current.favoriteApps.filter((id) => id !== app.id);
      } else {
        current.favoriteApps.push(app.id);
      }

      return current;
    });
  }

  async function toggleHidden() {
    downloaderStore.set((current) => {
      current.hiddenApps ??= [];

      if (current.hiddenApps.includes(app.id)) {
        current.hiddenApps = current.hiddenApps.filter((id) => id !== app.id);
      } else {
        current.hiddenApps.push(app.id);
      }

      return current;
    });
  }

  async function installApp() {
    await DownloadManager.addToQueue(app);
  }

  async function verifyAndRepair() {
    isVerifying = true;

    try {
      const { requiresRepair } = await Legendary.verify(app.id);
      if (!requiresRepair) {
        return toast.success($t('library.app.verified', { name: app.title }));
      }

      toast.success($t('library.app.requiresRepair', { name: app.title }));
      await DownloadManager.addToQueue(app);
    } catch (error) {
      handleError({ error, message: $t('library.app.failedToVerify', { name: app.title }) });
    } finally {
      isVerifying = false;
    }
  }
</script>

<div
  class="group relative flex flex-col rounded-md bg-card"
  oncontextmenu={(e) => {
    e.preventDefault();
    dropdownOpen = true;
  }}
  role="button"
  tabindex="0"
>
  <img class="size-full rounded-t-md object-cover" alt="Thumbnail" loading="lazy" src={app.images.tall} />

  <div class="absolute top-2 right-2 flex flex-col space-y-2">
    <button
      class="rounded-full bg-black p-1.5 group-hover:block"
      class:hidden={!isFavorited}
      onclick={toggleFavorite}
      title={isFavorited ? $t('library.app.unfavorite') : $t('library.app.favorite')}
    >
      <HeartIcon class="size-4.5 {isFavorited ? 'text-red-500' : 'text-gray-400'}" fill={isFavorited ? 'red' : ''} />
    </button>

    <button
      class="hidden rounded-full bg-black p-1.5 group-hover:block"
      onclick={toggleHidden}
      title={isHidden ? $t('library.app.show') : $t('library.app.hide')}
    >
      {#if isHidden}
        <EyeOffIcon class="size-4.5 text-gray-400" />
      {:else}
        <EyeIcon class="size-4.5 text-gray-400" />
      {/if}
    </button>
  </div>

  <div class="flex flex-col gap-2 p-3">
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <h1 class="truncate text-sm leading-tight font-medium">
          {app.title}
        </h1>

        {#if app.installed}
          <div class="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <HardDriveIcon class="size-3" />
            {bytesToSize(app.installSize)}
          </div>
        {/if}
      </div>

      {#if app.installed}
        <AppDropdown {app} {verifyAndRepair} bind:open={dropdownOpen} bind:uninstallDialogAppId bind:isVerifying />
      {/if}
    </div>

    <div class="flex">
      {#if app.installed && !DownloadManager.isInQueue(app.id)}
        {#if app.hasUpdate}
          {@render UpdateButton()}
        {:else if app.requiresRepair}
          {@render RepairButton()}
        {:else if runningAppIds.has(app.id)}
          {@render StopButton()}
        {:else}
          {@render PlayButton()}
        {/if}
      {:else if DownloadManager.isInQueue(app.id) && !isInstalling && DownloadManager.queue.length > 1}
        {@render RemoveFromQueueButton()}
      {:else}
        {@render InstallButton()}
      {/if}
    </div>
  </div>
</div>

{#snippet StopButton()}
  <Button
    class="flex min-w-0 flex-1 items-center justify-center gap-1.5"
    disabled={isStopping}
    onclick={() => stopApp()}
    size="sm"
    variant="secondary"
  >
    {#if isStopping}
      <LoaderCircleIcon class="size-4.5 animate-spin" />
    {:else}
      <XIcon class="size-4.5" />
    {/if}
    <span class="truncate">{$t('library.app.stop')}</span>
  </Button>
{/snippet}

{#snippet PlayButton()}
  <Button
    class="flex min-w-0 flex-1 items-center justify-center gap-1.5"
    disabled={isLaunching || isVerifying || isDeleting}
    onclick={() => launchApp()}
    size="sm"
  >
    {#if isLaunching}
      <LoaderCircleIcon class="size-4.5 animate-spin" />
    {:else}
      <PlayIcon class="size-4.5" fill="inherit" />
    {/if}
    <span class="truncate">{$t('library.app.play')}</span>
  </Button>
{/snippet}

{#snippet UpdateButton()}
  <Button
    class="flex min-w-0 flex-1 items-center justify-center gap-1.5"
    disabled={isVerifying || isDeleting}
    onclick={installApp}
    size="sm"
    variant="secondary"
  >
    <RefreshCwIcon class="size-4.5" />
    <span class="truncate">{$t('library.app.update')}</span>
  </Button>
{/snippet}

{#snippet RepairButton()}
  <Button
    class="flex min-w-0 flex-1 items-center justify-center gap-1.5"
    disabled={isVerifying || isDeleting}
    onclick={verifyAndRepair}
    size="sm"
    variant="secondary"
  >
    <WrenchIcon class="size-4.5" />
    <span class="truncate">{$t('library.app.repair')}</span>
  </Button>
{/snippet}

{#snippet RemoveFromQueueButton()}
  <Button
    class="flex min-w-0 flex-1 items-center justify-center gap-1.5"
    onclick={() => DownloadManager.removeFromQueue(app.id)}
    size="sm"
    title={$t('library.app.removeFromQueue.long')}
    variant="secondary"
  >
    <CircleMinusIcon class="size-4.5" />
    <span class="truncate">{$t('library.app.removeFromQueue.short')}</span>
  </Button>
{/snippet}

{#snippet InstallButton()}
  <Button
    class="flex min-w-0 flex-1 items-center justify-center gap-1.5"
    disabled={isInstalling}
    onclick={() => (installDialogAppId = app.id)}
    size="sm"
    variant="secondary"
  >
    {#if isInstalling}
      <LoaderCircleIcon class="size-4.5 animate-spin" />
    {:else}
      <DownloadIcon class="size-4.5" />
    {/if}

    <span class="truncate">
      {#if app.hasUpdate}
        {$t('library.app.update')}
      {:else if app.requiresRepair}
        {$t('library.app.repair')}
      {:else}
        {$t('library.app.install')}
      {/if}

      {#if isInstalling && DownloadManager.progress.percent}
        ({Math.floor(DownloadManager.progress.percent)}%)
      {/if}
    </span>
  </Button>
{/snippet}
