import FileStore from '$lib/storage/file-store';
import type { DownloaderSettings } from '$types/settings';
import { homeDir } from '@tauri-apps/api/path';
import * as path from '@tauri-apps/api/path';
import { downloaderSettingsSchema } from '$lib/validations/settings';

const downloadPath = await path.join(await homeDir(), 'Games', 'Spitfire Launcher');

export default class DownloaderStore extends FileStore<DownloaderSettings> {
  constructor() {
    super('downloader', {
      downloadPath,
      noHTTPS: false,
      autoUpdate: true,
      sendNotifications: true,
      favoriteApps: [],
      hiddenApps: [],
      perAppAutoUpdate: {},
      queue: {}
    }, downloaderSettingsSchema);
  }
}