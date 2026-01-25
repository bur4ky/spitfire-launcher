<script lang="ts">
  import DownloadManager from '$lib/managers/download.svelte.js';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { platform } from '@tauri-apps/plugin-os';
  import LaunchGame from '$components/layout/header/LaunchGame.svelte';
  import SettingsModal from '$components/features/settings/SettingsModal.svelte';
  import SidebarBurger from '$components/layout/header/SidebarBurger.svelte';
  import LanguageSwitcher from '$components/layout/header/LanguageSwitcher.svelte';
  import MinusIcon from '@lucide/svelte/icons/minus';
  import XIcon from '@lucide/svelte/icons/x';
  import { settingsStore } from '$lib/storage';

  const appWindow = getCurrentWindow();
  const currentPlatform = platform();
  const isMobile = currentPlatform === 'android' || currentPlatform === 'ios';

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

<!-- TODO: Could use `padding-top: env(safe-area-inset-top)` but it still overlaps, same for sidebar -->
<header
  class="{isMobile ? 'pt-6 h-22' : 'h-16'} bg-card border-b border-border flex items-center justify-between md:justify-end px-4 select-none sticky top-0 z-10"
  data-tauri-drag-region
>
  <SidebarBurger/>

  <div class="flex items-center gap-x-2">
    <div class="flex items-center gap-x-2">
      {#if currentPlatform === 'windows'}
        <LaunchGame/>
      {/if}

      <SettingsModal/>
      <LanguageSwitcher/>
    </div>

    {#if !isMobile}
      <div class="flex items-center space-x-2 max-sm:hidden">
        <button class="p-2 hover:bg-accent rounded transition-colors duration-200" onclick={minimizeOrHide}>
          <MinusIcon/>
        </button>
        <button class="p-2 hover:bg-red-500/80 hover:text-white rounded transition-colors duration-200" onclick={close}>
          <XIcon/>
        </button>
      </div>
    {/if}
  </div>
</header>