import FileStore from '$lib/storage/file-store';
import type { AllSettings } from '$types/settings';
import { allSettingsSchema } from '$lib/validations/settings';

export default class SettingsStore extends FileStore<AllSettings> {
  constructor() {
    super('settings', {
      app: {
        language: null,
        claimRewardsDelay: 1.5,
        missionCheckInterval: 5,
        startingPage: 'stwMissionAlerts',
        discordStatus: true,
        hideToTray: false,
        checkForUpdates: true,
        debugLogs: false
      }
    }, allSettingsSchema);
  }
}
