<script lang="ts">
  import LaunchGame from '$components/layout/header/LaunchGame.svelte';
  import SidebarBurger from '$components/layout/header/SidebarBurger.svelte';
  import SettingsModal from '$components/modules/settings/SettingsModal.svelte';
  import { useSidebar } from '$components/ui/sidebar';
  import { DownloadManager } from '$lib/modules/download.svelte.js';
  import { settingsStore } from '$lib/storage';
  import MinusIcon from '@lucide/svelte/icons/minus';
  import XIcon from '@lucide/svelte/icons/x';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { platform } from '@tauri-apps/plugin-os';

  const appWindow = getCurrentWindow();
  const sidebar = useSidebar();

  async function minimizeOrHide() {
    if (settingsStore.get().app?.hideToTray) {
      await appWindow.hide();
    } else {
      await appWindow.minimize();
    }
  }

  async function close() {
    await DownloadManager.pauseDownload();
    await appWindow.close();
  }
</script>

<header
  class="pt-safe sticky top-0 z-10 flex h-[calc(4rem+env(safe-area-inset-top))] items-center justify-between border-b bg-card px-4 select-none md:justify-end"
  data-tauri-drag-region
>
  <SidebarBurger />

  <div class="flex items-center gap-x-2">
    <div class="flex items-center gap-x-2">
      {#if platform() === 'windows'}
        <LaunchGame />
      {/if}

      <SettingsModal />
    </div>

    {#if !sidebar.isMobile}
      <div class="flex items-center space-x-2 max-sm:hidden">
        <button class="rounded p-2 transition-colors duration-200 hover:bg-accent" onclick={minimizeOrHide}>
          <MinusIcon />
        </button>
        <button class="rounded p-2 transition-colors duration-200 hover:bg-red-500/80 hover:text-white" onclick={close}>
          <XIcon />
        </button>
      </div>
    {/if}
  </div>
</header>
