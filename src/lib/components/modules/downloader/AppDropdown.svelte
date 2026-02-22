<script lang="ts">
  import { Button } from '$components/ui/button';
  import * as DropdownMenu from '$components/ui/dropdown-menu';
  import { downloaderStore } from '$lib/storage';
  import { DownloadManager } from '$lib/modules/download.svelte.js';
  import { t } from '$lib/i18n';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import RefreshCwOffIcon from '@lucide/svelte/icons/refresh-cw-off';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import WrenchIcon from '@lucide/svelte/icons/wrench';
  import type { ParsedApp } from '$types/legendary';
  import { runningAppIds } from '$lib/stores';

  type Props = {
    open?: boolean;
    app: ParsedApp;
    isVerifying: boolean;
    verifyAndRepair: () => Promise<unknown>;
    uninstallDialogAppId?: string;
  };

  let {
    open = $bindable(),
    app,
    verifyAndRepair,
    isVerifying = $bindable(),
    uninstallDialogAppId = $bindable()
  }: Props = $props();

  async function toggleAutoUpdate() {
    downloaderStore.set((current) => {
      current.perAppAutoUpdate ??= {};
      current.perAppAutoUpdate[app.id] = !(current.perAppAutoUpdate[app.id] ?? current.autoUpdate);
      return current;
    });
  }
</script>

<DropdownMenu.Root bind:open>
  <DropdownMenu.Trigger>
    <Button class="ml-auto font-medium" size="icon" variant="ghost">
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

      <DropdownMenu.Item disabled={isVerifying || runningAppIds.has(app.id)} onclick={verifyAndRepair}>
        {#if isVerifying}
          <LoaderCircleIcon class="size-5 animate-spin" />
        {:else}
          <WrenchIcon class="size-5" />
        {/if}
        {$t('library.app.dropdown.verifyAndRepair')}
      </DropdownMenu.Item>

      <DropdownMenu.Item
        disabled={isVerifying || runningAppIds.has(app.id) || !!DownloadManager.downloadingAppId}
        onclick={() => (uninstallDialogAppId = app.id)}
      >
        <Trash2Icon class="size-5" />
        {$t('library.app.dropdown.uninstall')}
      </DropdownMenu.Item>
    {/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>
