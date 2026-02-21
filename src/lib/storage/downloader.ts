import { downloaderSettingsSchema } from '$lib/schemas/settings';
import { FileStore } from '$lib/storage/file-store';
import type { DownloaderSettings } from '$types/settings';
import * as path from '@tauri-apps/api/path';
import { homeDir } from '@tauri-apps/api/path';

const downloadPath = await path.join(await homeDir(), 'Games', 'Spitfire Launcher');

export class DownloaderStore extends FileStore<DownloaderSettings> {
  constructor() {
    super(
      'downloader',
      {
        downloadPath,
        noHTTPS: false,
        autoUpdate: true,
        sendNotifications: true,
        favoriteApps: [],
        hiddenApps: [],
        perAppAutoUpdate: {},
        queue: {}
      },
      downloaderSettingsSchema
    );
  }
}
