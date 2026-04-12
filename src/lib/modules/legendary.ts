import { get } from 'svelte/store';
import { dev } from '$app/environment';
import { path } from '@tauri-apps/api';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { LegendaryError } from '$lib/exceptions/LegendaryError';
import { legendaryService } from '$lib/http';
import { getChildLogger } from '$lib/logger';
import { AuthSession } from '$lib/modules/auth-session';
import { Authentication } from '$lib/modules/authentication';
import { dataDirectory } from '$lib/storage/file-store';
import { ownedAppsCache } from '$lib/stores';
import { Tauri } from '$lib/tauri';
import type { AccountData } from '$types/account';
import type { EpicOAuthData } from '$types/game/authorizations';
import type {
  LegendaryAppInfo,
  LegendaryInstalledList,
  LegendaryLaunchData,
  LegendaryList,
  LegendarySDLResponse,
  LegendaryStatus
} from '$types/legendary';

const logger = getChildLogger('Legendary');
export const configPath = await path.join(dataDirectory, dev ? 'legendary-dev' : 'legendary');

type ExecuteResult<T = any> = {
  code: number | null;
  signal: number | null;
  stdout: T;
  stderr: string;
};

export class Legendary {
  private static accountId?: string;

  static async execute<T>(args: string[]): Promise<ExecuteResult<T>> {
    try {
      const result = await Tauri.runLegendary({ configPath, args });

      logger.debug('Command executed', {
        args,
        code: result.code,
        signal: result.signal,
        stderr: result.stderr?.slice(-512)
      });

      let stdout = result.stdout as T;
      if (args.includes('--json')) {
        stdout = JSON.parse(result.stdout) as T;
      }

      if (result.code !== 0) {
        throw new Error(result.stderr);
      }

      return {
        code: result.code,
        signal: result.signal,
        stdout,
        stderr: result.stderr
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new LegendaryError(message);
    }
  }

  static async login(account: AccountData) {
    const accessToken = await AuthSession.new(account).getAccessToken();
    const { code: exchange } = await Authentication.getExchangeCodeUsingAccessToken(accessToken);

    const data = await Legendary.execute<string>(['auth', '--token', exchange]);
    Legendary.accountId = account.accountId;
    return data;
  }

  static async logout() {
    const data = await Legendary.execute<string>(['auth', '--delete']);
    Legendary.accountId = undefined;
    ownedAppsCache.set([]);
    return data;
  }

  static getList() {
    return Legendary.execute<LegendaryList>(['list', '--json']);
  }

  static async getStatus() {
    const { stdout } = await Legendary.execute<LegendaryStatus>(['status', '--json']);
    if (stdout.account === '<not logged in>') {
      stdout.account = null;
    }

    return stdout;
  }

  static async getAccount() {
    if (Legendary.accountId) {
      return Legendary.accountId;
    }

    try {
      const userConfig = await path.join(configPath, 'user.json');
      const file = await readTextFile(userConfig);
      const data: EpicOAuthData = JSON.parse(file);
      if (!data.account_id) return null;

      Legendary.accountId = data.account_id;
      return data.account_id;
    } catch {
      return null;
    }
  }

  static getAppInfo(appId: string) {
    return Legendary.execute<LegendaryAppInfo>(['info', appId, '--json']);
  }

  static getInstalledList() {
    return Legendary.execute<LegendaryInstalledList>(['list-installed', '--json']);
  }

  static syncEGL() {
    return Legendary.execute(['egl-sync', '-y', '--enable-sync']);
  }

  static async launch(appId: string) {
    const { stdout: launchData } = await Legendary.execute<LegendaryLaunchData>([
      'launch',
      appId,
      '--dry-run',
      '--json'
    ]);

    return Tauri.launchApp({
      launchData: {
        ...launchData,
        game_id: appId
      }
    });
  }

  static async verify(appId: string) {
    const { stderr } = await Legendary.execute<string>(['verify', appId, '-y', '--skip-sdl']);
    const requiresRepair = stderr.includes('repair your game installation');
    const requiredRepair = get(ownedAppsCache).find((app) => app.id === appId)?.requiresRepair || false;

    if (requiresRepair !== requiredRepair) {
      ownedAppsCache.update((current) => {
        return current.map((app) => (app.id === appId ? { ...app, requiresRepair } : app));
      });
    }

    return { requiresRepair };
  }

  static async uninstall(appId: string) {
    const data = await Legendary.execute(['uninstall', appId, '-y']);

    ownedAppsCache.update((current) => {
      return current.map((app) => (app.id === appId ? { ...app, installed: false } : app));
    });

    return data;
  }

  static async cacheApps() {
    const list = await Legendary.getList();
    await Legendary.syncEGL();
    const installedList = await Legendary.getInstalledList();

    ownedAppsCache.set(
      list.stdout
        .filter((app) => app.metadata.entitlementType === 'EXECUTABLE')
        .map((app) => {
          const images = app.metadata.keyImages.reduce<Record<string, string>>((acc, image) => {
            acc[image.type] = image.url;
            return acc;
          }, {});

          const installed = installedList.stdout.find((installed) => installed.app_name === app.app_name);

          return {
            id: app.app_name,
            title: app.app_title,
            images: {
              tall: images.DieselGameBoxTall || app.metadata.keyImages[0]?.url,
              wide: images.DieselGameBox || images.Featured || app.metadata.keyImages[0]?.url
            },
            requiresRepair: installed && installed.needs_verification,
            hasUpdate: installed ? installed.version !== app.asset_infos.Windows.build_version : false,
            installSize: installed?.install_size || 0,
            installed: !!installed,
            canRunOffline: installed?.can_run_offline || false
          };
        })
    );
  }

  static async getSDLList(appName: string) {
    const response = await legendaryService.get(`v1/sdl/${appName}.json`);
    if (!response.headers.get('Content-Type')?.includes('application/json')) {
      throw new LegendaryError('App not found');
    }

    return await response.json<LegendarySDLResponse>();
  }
}
