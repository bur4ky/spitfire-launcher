<script lang="ts">
  import './layout.css';
  import Sidebar from '$components/layout/sidebar/Sidebar.svelte';
  import Header from '$components/layout/header/Header.svelte';
  import AvatarManager from '$lib/managers/avatar';
  import LookupManager from '$lib/managers/lookup';
  import DownloadManager from '$lib/managers/download.svelte';
  import SystemTray from '$lib/system-tray';
  import Legendary from '$lib/epic/legendary';
  import { getVersion } from '@tauri-apps/api/app';
  import { listen } from '@tauri-apps/api/event';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import { Toaster } from 'svelte-sonner';
  import { onMount } from 'svelte';
  import ky from 'ky';
  import type { GitHubRelease } from '$types/github';
  import { Button } from '$components/ui/button';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import * as Dialog from '$components/ui/dialog';
  import * as Tooltip from '$components/ui/tooltip';
  import WorldInfoManager from '$lib/managers/world-info';
  import { ownedApps, runningAppIds } from '$lib/stores';
  import AutoKickBase from '$lib/managers/autokick/base';
  import { handleError, t } from '$lib/utils';
  import { platform } from '@tauri-apps/plugin-os';
  import logger, { setLogLevel } from '$lib/logger';
  import Tauri from '$lib/tauri';
  import { accountStore, settingsStore } from '$lib/storage';
  import { on } from 'svelte/events';

  const { children } = $props();

  let hasNewVersion = $state(false);
  let newVersionData = $state<{ tag: string; downloadUrl: string }>();

  async function checkForUpdates() {
    if (!settingsStore.get().app?.checkForUpdates) return;

    const currentVersion = await getVersion();
    const latestVersion = await ky.get<GitHubRelease>(`https://api.github.com/repos/bur4ky/spitfire-launcher/releases/latest`).json();

    if (latestVersion.tag_name.replace('v', '') !== currentVersion) {
      hasNewVersion = true;
      newVersionData = {
        tag: latestVersion.tag_name.replace('v', ''),
        downloadUrl: latestVersion.html_url
      };
    }
  }

  async function syncAccountNames() {
    const account = accountStore.getActive();
    if (!account) return;

    const userAccounts = accountStore.get().accounts;
    const accounts = await LookupManager.fetchByIds(account, userAccounts.map((account) => account.accountId));
    accountStore.set((current) => ({
      ...current,
      accounts: current.accounts.map((account) => ({
        ...account,
        displayName: accounts.find((acc) => acc.id === account.accountId)?.displayName || account.displayName
      }))
    }));
  }

  async function autoUpdateApps() {
    const { account } = await Legendary.getStatus();
    if (!account) return;

    await Legendary.cacheApps();
    await Legendary.autoUpdateApps();
  }

  async function getAppName(appId: string) {
    const cached = $ownedApps.find((app) => app.id === appId);
    if (cached) return cached.title;

    const appInfo = await Legendary.getAppInfo(appId);
    return appInfo.stdout.game.title;
  }

  async function setupDiscordRPC() {
    const defaultDiscordStatus = 'In the launcher';

    let previousDcStatus = false;
    settingsStore.subscribe(async (data) => {
      setLogLevel(data.app?.debugLogs ? 'debug' : 'info');

      SystemTray.setVisibility(data.app?.hideToTray || false).catch((error) => {
        logger.error('Failed to set tray visibility', { error });
      });

      const dcStatusEnabled = data.app!.discordStatus!;
      if (dcStatusEnabled !== previousDcStatus) {
        previousDcStatus = dcStatusEnabled;

        if (dcStatusEnabled) {
          await Tauri.connectDiscordRPC();
          await Tauri.updateDiscordRPC({ details: defaultDiscordStatus });
        } else {
          await Tauri.disconnectDiscordRPC();
        }
      }
    });

    listen<{
      pid: number;
      app_id: string;
      state: 'running' | 'stopped';
    }>('app_state_changed', async (event) => {
      const appId = event.payload.app_id;
      const discordStatus = settingsStore.get().app?.discordStatus;

      if (event.payload.state === 'running') {
        runningAppIds.add(appId);

        if (discordStatus !== true) return;

        const appName = await getAppName(appId).catch(() => null);
        if (!appName) return;

        await Tauri.updateDiscordRPC({ details: `Playing ${appName}` });
      } else {
        runningAppIds.delete(appId);

        if (discordStatus !== true) return;

        const newApp = Array.from(runningAppIds)[0];
        const appName = newApp ? await getAppName(newApp).catch(() => null) : null;
        if (newApp && appName) {
          await Tauri.updateDiscordRPC({ details: `Playing ${appName}` });
        } else {
          await Tauri.updateDiscordRPC({ details: defaultDiscordStatus });
        }
      }
    });

    if (platform() === 'windows') {
      // Used to set running apps when the page is refreshed
      Tauri.getTrackedApps().then((apps) => {
        for (const app of apps) {
          if (app.is_running) {
            runningAppIds.add(app.app_id);
          } else {
            runningAppIds.delete(app.app_id);
          }
        }
      }).catch((error) => {
        logger.error('Failed to get tracked apps', { error });
      });
    }
  }

  onMount(() => {
    // logger.error gives more context than unhandled console.error
    on(window, 'error', (event) => {
      logger.error('Unhandled error occurred', { error: event.error });
    });
    
    Promise.allSettled([
      setupDiscordRPC(),
      AutoKickBase.init(),
      DownloadManager.init(),
      WorldInfoManager.setCache(),
      checkForUpdates(),
      syncAccountNames(),
      autoUpdateApps(),
      // We could fetch all avatars using a single account
      // However, fetching per account allows invalid accounts to fail independently
      // and be detected and removed from the config.
      accountStore.get().accounts.map((x) =>
        AvatarManager.fetchAvatars(x, [x.accountId])
          .catch((error) => {
            handleError({
              error,
              message: 'Failed to fetch avatar',
              account: x.accountId,
              toastId: false
            });
          })
      )
    ]);
  });
</script>

<Tooltip.Provider>
  <div class="flex">
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 3000,
        unstyled: true,
        classes: {
          toast: 'bg-secondary flex items-center px-4 py-4 border rounded-lg gap-3 min-w-96 max-xs:min-w-80',
          title: 'text-sm'
        }
      }}
    >
      {#snippet loadingIcon()}
        <LoaderCircleIcon class="animate-spin size-5" />
      {/snippet}
    </Toaster>

    <Sidebar />

    <div class="flex flex-col flex-1">
      <Header />
      <div>
        <main class="px-5 py-5 xs:px-10 sm:py-10 sm:px-20 flex-1 overflow-auto bg-background h-[calc(100dvh-4rem)]">
          {@render children()}
        </main>
      </div>
    </div>
  </div>
</Tooltip.Provider>

<Dialog.Root bind:open={hasNewVersion}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        {$t('newVersionAvailable.title')}
      </Dialog.Title>

      <Dialog.Description>
        {$t('newVersionAvailable.description', { version: newVersionData?.tag })}
      </Dialog.Description>
    </Dialog.Header>

    <Button
      class="flex gap-2 justify-center items-center w-fit"
      href={newVersionData?.downloadUrl}
    >
      <ExternalLinkIcon class="size-5" />
      {$t('newVersionAvailable.download')}
    </Button>
  </Dialog.Content>
</Dialog.Root>
