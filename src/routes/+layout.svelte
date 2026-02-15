<script lang="ts">
  import './layout.css';
  import Header from '$components/layout/header/Header.svelte';
  import Sidebar from '$components/layout/sidebar/Sidebar.svelte';
  import { Button } from '$components/ui/button';
  import * as Dialog from '$components/ui/dialog';
  import * as Tooltip from '$components/ui/tooltip';
  import { language, t } from '$lib/i18n';
  import { logger, setLogLevel } from '$lib/logger';
  import { AutoKickBase } from '$lib/modules/autokick/base';
  import { Avatar } from '$lib/modules/avatar';
  import { DownloadManager } from '$lib/modules/download.svelte';
  import { Legendary } from '$lib/modules/legendary';
  import { Lookup } from '$lib/modules/lookup';
  import { WorldInfo } from '$lib/modules/world-info';
  import { setLocale } from '$lib/paraglide/runtime';
  import { accountStore, downloaderStore, settingsStore } from '$lib/storage';
  import { ownedApps, runningAppIds } from '$lib/stores';
  import { Tauri } from '$lib/tauri';
  import { handleError } from '$lib/utils';
  import type { GitHubRelease } from '$types/github';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import { getVersion } from '@tauri-apps/api/app';
  import { listen } from '@tauri-apps/api/event';
  import { platform } from '@tauri-apps/plugin-os';
  import ky from 'ky';
  import { onMount } from 'svelte';
  import { toast, Toaster } from 'svelte-sonner';
  import { on } from 'svelte/events';
  import { get } from 'svelte/store';

  const { children } = $props();

  let hasNewVersion = $state(false);
  let newVersionData = $state<{ tag: string; downloadUrl: string }>();

  async function checkForUpdates() {
    if (!settingsStore.get().app?.checkForUpdates) return;

    const currentVersion = await getVersion();
    const latestVersion = await ky
      .get<GitHubRelease>(`https://api.github.com/repos/bur4ky/spitfire-launcher/releases/latest`)
      .json();

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
    const accounts = await Lookup.fetchByIds(
      account,
      userAccounts.map((account) => account.accountId)
    );
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

    const settings = downloaderStore.get();
    const updatableApps = get(ownedApps).filter((app) => app.hasUpdate);
    const appAutoUpdate = settings.perAppAutoUpdate || {};

    let sentFirstNotification = false;

    for (const app of updatableApps) {
      if (appAutoUpdate[app.id] ?? settings.autoUpdate) {
        await DownloadManager.addToQueue(app);

        if (!sentFirstNotification) {
          sentFirstNotification = true;
          toast.info(get(t)('library.app.startedUpdate', { name: app.title }));
        }
      }
    }
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
      Tauri.setTrayVisibility({ visible: !!data.app?.hideToTray });

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
      Tauri.getTrackedApps()
        .then((apps) => {
          for (const app of apps) {
            if (app.is_running) {
              runningAppIds.add(app.app_id);
            } else {
              runningAppIds.delete(app.app_id);
            }
          }
        })
        .catch((error) => {
          logger.error('Failed to get tracked apps', { error });
        });
    }
  }

  onMount(() => {
    // logger.error gives more context than unhandled console.error
    on(window, 'error', (event) => {
      logger.error('Unhandled error occurred', { error: event.error });
    });

    language.subscribe((locale) => {
      setLocale(locale, { reload: false });
      document.documentElement.lang = locale;

      settingsStore.set((settings) => {
        settings.app ??= {};
        settings.app.language = locale;
        return settings;
      });
    });

    Promise.allSettled([
      setupDiscordRPC(),
      AutoKickBase.init(),
      DownloadManager.init(),
      WorldInfo.setCache(),
      checkForUpdates(),
      syncAccountNames(),
      autoUpdateApps(),
      // We could fetch all avatars using a single account
      // However, fetching per account allows invalid accounts to fail independently
      // and be detected and removed from the config.
      accountStore.get().accounts.map((x) =>
        Avatar.fetchAvatars(x, [x.accountId]).catch((error) => {
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
        <LoaderCircleIcon class="size-5 animate-spin" />
      {/snippet}
    </Toaster>

    <Sidebar />

    <div class="flex flex-1 flex-col">
      <Header />
      <div>
        <main class="h-[calc(100dvh-4rem)] flex-1 overflow-auto bg-background px-5 py-5 xs:px-10 sm:px-20 sm:py-10">
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

    <Button class="flex w-fit items-center justify-center gap-2" href={newVersionData?.downloadUrl}>
      <ExternalLinkIcon class="size-5" />
      {$t('newVersionAvailable.download')}
    </Button>
  </Dialog.Content>
</Dialog.Root>
