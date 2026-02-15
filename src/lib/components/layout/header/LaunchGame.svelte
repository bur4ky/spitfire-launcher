<script lang="ts">
  import { Button } from '$components/ui/button';
  import { launcherAppClient2 } from '$lib/constants/clients';
  import { t } from '$lib/i18n';
  import { AuthSession } from '$lib/modules/auth-session';
  import { Authentication } from '$lib/modules/authentication';
  import { Manifest } from '$lib/modules/manifest';
  import { accountStore, settingsStore } from '$lib/storage';
  import { runningAppIds } from '$lib/stores';
  import { type LaunchAppOptions, Tauri } from '$lib/tauri';
  import { handleError, sleep } from '$lib/utils';
  import { path } from '@tauri-apps/api';
  import { toast } from 'svelte-sonner';

  const activeAccount = accountStore.getActiveStore(true);
  const fortniteAppId = 'Fortnite';
  const launchData: LaunchAppOptions['launchData'] = {
    game_id: fortniteAppId,
    game_parameters: [],
    game_executable: 'FortniteGame/Binaries/Win64/FortniteLauncher.exe',
    game_directory: '',
    egl_parameters: [],
    launch_command: [],
    working_directory: '',
    user_parameters: [],
    environment: {},
    pre_launch_command: '',
    pre_launch_wait: false
  };

  let isLaunching = $state(false);
  let isStopping = $state(false);

  async function launchFortnite() {
    if (runningAppIds.has(fortniteAppId)) {
      toast.error($t('launchGame.alreadyRunning'));
      return;
    }

    isLaunching = true;
    const toastId = toast.loading($t('launchGame.launching'));

    try {
      const settings = settingsStore.get();
      const manifestData = await Manifest.getFortniteManifest();
      const customPath = settings.app?.gamePath;

      let gameDirectory = manifestData?.installLocation;
      if (customPath) {
        const [customInstallDir] = customPath.replaceAll('\\', '/').split('/FortniteGame/Binaries/Win64');
        gameDirectory = customInstallDir;
      }

      if (!gameDirectory) {
        toast.error($t('launchGame.notInstalled'), { id: toastId });
        return;
      }

      launchData.game_directory = gameDirectory;
      launchData.working_directory = await path.join(gameDirectory, 'FortniteGame/Binaries/Win64');

      const accessToken = await AuthSession.new($activeAccount!).getAccessToken(true);
      const oldExchangeData = await Authentication.getExchangeCodeUsingAccessToken(accessToken);
      const launcherAccessTokenData = await Authentication.getAccessTokenUsingExchangeCode(oldExchangeData.code, launcherAppClient2);
      const launcherExchangeData = await Authentication.getExchangeCodeUsingAccessToken(launcherAccessTokenData.access_token);

      launchData.game_parameters = manifestData?.launchCommand.split(' ') || [];
      launchData.user_parameters = settings.app?.launchArguments?.split(' ') || [];
      launchData.egl_parameters = [
        '-AUTH_LOGIN=unused',
        `-AUTH_PASSWORD=${launcherExchangeData.code}`,
        '-AUTH_TYPE=exchangecode',
        '-epicapp=Fortnite',
        '-epicenv=Prod',
        '-EpicPortal',
        `-epicusername=${$activeAccount!.displayName}`,
        `-epicuserid=${$activeAccount!.accountId}`,
        `-epicsandboxid=${manifestData?.namespace || 'fn'}`
      ];

      await Tauri.launchApp({ launchData });
    } catch (error) {
      handleError({
        error,
        message: 'Failed to launch Fortnite',
        toastId: false,
        account: $activeAccount || undefined
      });

      if (typeof error === 'string' && error.toLowerCase().includes('executable not found')) {
        toast.error($t('launchGame.notInstalled'), { id: toastId });
      } else {
        toast.error($t('launchGame.failedToLaunch'), { id: toastId });
      }
    } finally {
      isLaunching = false;
    }
  }

  async function stopFortnite() {
    isStopping = true;

    const toastId = toast.loading($t('launchGame.stopping'));

    try {
      await Tauri.stopApp({ appId: fortniteAppId });
      toast.success($t('launchGame.stopped'), { id: toastId });
    } catch (error) {
      handleError({ error, message: $t('launchGame.failedToStop'), toastId, account: $activeAccount || undefined });
    } finally {
      // A delay to ensure the app was killed properly
      await sleep(2000);
      isStopping = false;
    }
  }
</script>

<Button
  class="flex items-center justify-between gap-x-2 shrink-0"
  disabled={!$activeAccount || (isLaunching && !runningAppIds.has(fortniteAppId)) || isStopping}
  onclick={() => runningAppIds.has(fortniteAppId) ? stopFortnite() : launchFortnite()}
  variant={runningAppIds.has(fortniteAppId) ? 'destructive' : 'default'}
>
  {#if runningAppIds.has(fortniteAppId)}
    {$t('launchGame.stop')}
  {:else}
    {$t('launchGame.launch')}
  {/if}
</Button>
