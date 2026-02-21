<script lang="ts">
  import { Button } from '$components/ui/button';
  import * as DropdownMenu from '$components/ui/dropdown-menu';
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
  import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
  import PlayIcon from '@lucide/svelte/icons/play';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import RefreshCwOffIcon from '@lucide/svelte/icons/refresh-cw-off';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import WrenchIcon from '@lucide/svelte/icons/wrench';
  import XIcon from '@lucide/svelte/icons/x';
  import { toast } from 'svelte-sonner';

  type Props = {
    appId: string;
    installDialogAppId?: string;
    uninstallDialogAppId?: string;
  };

  let dropdownOpen = $state(false);
  let isLaunching = $state(false);
  let isStopping = $state(false);
  let isDeleting = $state(false);
  let isVerifying = $state(false);

  let { appId, installDialogAppId = $bindable(), uninstallDialogAppId = $bindable() }: Props = $props();

  const app = $derived($ownedApps.find((x) => x.id === appId)!);

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

  async function toggleAutoUpdate() {
    downloaderStore.set((current) => {
      current.perAppAutoUpdate ??= {};
      current.perAppAutoUpdate[app.id] = !(current.perAppAutoUpdate[app.id] ?? current.autoUpdate);
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
  class="group mt-3 flex w-44 flex-col rounded-md bg-card"
  oncontextmenu={(e) => {
    e.preventDefault();
    dropdownOpen = true;
  }}
  role="button"
  tabindex="0"
>
  <div class="relative">
    <img class="size-full h-60 rounded-t-md object-cover" alt="Thumbnail" loading="lazy" src={app.images.tall} />

    <div class="absolute top-2 right-2 flex flex-col space-y-2">
      {#if $downloaderStore.favoriteApps?.includes(app.id)}
        <button class="rounded-full bg-black p-1.5" onclick={toggleFavorite} title={$t('library.app.unfavorite')}>
          <HeartIcon class="size-4.5 text-red-500" fill="red" />
        </button>
      {:else}
        <button
          class="hidden rounded-full bg-black p-1.5 group-hover:block"
          onclick={toggleFavorite}
          title={$t('library.app.favorite')}
        >
          <HeartIcon class="size-4.5 text-gray-400" />
        </button>
      {/if}

      {#if $downloaderStore.hiddenApps?.includes(app.id)}
        <button
          class="hidden rounded-full bg-black p-1.5 group-hover:block"
          onclick={toggleHidden}
          title={$t('library.app.show')}
        >
          <EyeOffIcon class="size-4.5 text-gray-400" />
        </button>
      {:else}
        <button
          class="hidden rounded-full bg-black p-1.5 group-hover:block"
          onclick={toggleHidden}
          title={$t('library.app.hide')}
        >
          <EyeIcon class="size-4.5 text-gray-400" />
        </button>
      {/if}
    </div>

    <div
      class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
    >
      <h3 class="mt-6 font-semibold text-white">
        {app.title}
      </h3>
    </div>
  </div>

  <div class="flex grow gap-1 p-3">
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

      <DropdownMenu.Root bind:open={dropdownOpen}>
        <DropdownMenu.Trigger>
          <Button class="ml-auto font-medium" size="icon" variant="outline">
            <EllipsisVertical />
          </Button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content>
          {#if app.installed}
            <DropdownMenu.Item onclick={toggleAutoUpdate}>
              {#if ($downloaderStore.perAppAutoUpdate || {})[app.id] ?? $downloaderStore.autoUpdate}
                <RefreshCwOffIcon class="size-5" />
                {$t('library.app.dropdown.autoUpdate.disable')}
              {:else}
                <RefreshCwIcon class="size-5" />
                {$t('library.app.dropdown.autoUpdate.enable')}
              {/if}
            </DropdownMenu.Item>

            <DropdownMenu.Item
              disabled={isVerifying || isDeleting || runningAppIds.has(app.id)}
              onclick={verifyAndRepair}
            >
              {#if isVerifying}
                <LoaderCircleIcon class="size-5 animate-spin" />
              {:else}
                <WrenchIcon class="size-5" />
              {/if}
              {$t('library.app.dropdown.verifyAndRepair')}
            </DropdownMenu.Item>

            <DropdownMenu.Item
              disabled={isVerifying || isDeleting || runningAppIds.has(app.id) || !!DownloadManager.downloadingAppId}
              onclick={() => (uninstallDialogAppId = app.id)}
            >
              {#if isDeleting}
                <LoaderCircleIcon class="size-5 animate-spin" />
              {:else}
                <Trash2Icon class="size-5" />
              {/if}
              {$t('library.app.dropdown.uninstall')}
            </DropdownMenu.Item>

            <DropdownMenu.Item disabled={true}>
              <HardDriveIcon class="size-5" />
              {$t('library.app.dropdown.size')}: {bytesToSize(app.installSize)}
            </DropdownMenu.Item>
          {/if}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {:else}
      {@const isInstalling = DownloadManager.downloadingAppId === app.id}

      {#if DownloadManager.isInQueue(app.id) && !isInstalling && DownloadManager.queue.length > 1}
        {@render RemoveFromQueueButton()}
      {:else}
        {@render InstallButton(isInstalling)}
      {/if}
    {/if}
  </div>
</div>

{#snippet StopButton()}
  <Button
    class="flex flex-1 items-center justify-center gap-2 truncate text-sm"
    disabled={isStopping}
    onclick={() => stopApp()}
    variant="destructive"
  >
    {#if isStopping}
      <LoaderCircleIcon class="size-5 animate-spin" />
    {:else}
      <XIcon class="size-5" />
    {/if}
    <span class="truncate">{$t('library.app.stop')}</span>
  </Button>
{/snippet}

{#snippet PlayButton()}
  <Button
    class="flex flex-1 items-center justify-center gap-2 truncate text-sm"
    disabled={isLaunching || isVerifying || isDeleting}
    onclick={() => launchApp()}
  >
    {#if isLaunching}
      <LoaderCircleIcon class="size-5 animate-spin" />
    {:else}
      <PlayIcon class="size-5" />
    {/if}
    <span class="truncate">{$t('library.app.play')}</span>
  </Button>
{/snippet}

{#snippet UpdateButton()}
  <Button
    class="flex flex-1 items-center justify-center gap-2 truncate text-sm"
    disabled={isVerifying || isDeleting}
    onclick={installApp}
    variant="secondary"
  >
    <RefreshCwIcon class="size-5" />
    <span class="truncate">{$t('library.app.update')}</span>
  </Button>
{/snippet}

{#snippet RepairButton()}
  <Button
    class="flex flex-1 items-center justify-center gap-2 truncate text-sm"
    disabled={isVerifying || isDeleting}
    onclick={verifyAndRepair}
    variant="secondary"
  >
    <WrenchIcon class="size-5" />
    <span class="truncate">{$t('library.app.repair')}</span>
  </Button>
{/snippet}

{#snippet RemoveFromQueueButton()}
  <Button
    class="flex flex-1 items-center justify-center gap-2 truncate text-sm"
    onclick={() => DownloadManager.removeFromQueue(app.id)}
    title={$t('library.app.removeFromQueue.long')}
    variant="destructive"
  >
    <CircleMinusIcon class="size-5" />
    <span class="truncate">{$t('library.app.removeFromQueue.short')}</span>
  </Button>
{/snippet}

{#snippet InstallButton(isInstalling: boolean)}
  {@const percent =
    isInstalling && DownloadManager.progress.percent ? `(${Math.floor(DownloadManager.progress.percent)}%)` : ''}

  <Button
    class="flex flex-1 items-center justify-center gap-2 truncate text-sm"
    disabled={isInstalling}
    onclick={() => (installDialogAppId = app.id)}
    variant="outline"
  >
    {#if isInstalling}
      <LoaderCircleIcon class="size-5 animate-spin" />
    {:else}
      <DownloadIcon class="size-5" />
    {/if}

    <span class="truncate">
      {#if app.hasUpdate}
        {$t('library.app.update')}
      {:else if app.requiresRepair}
        {$t('library.app.repair')}
      {:else}
        {$t('library.app.install')}
      {/if}

      {percent}
    </span>
  </Button>
{/snippet}
