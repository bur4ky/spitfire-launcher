import type { Locale } from '$lib/paraglide/runtime';
import { allSettingsSchema } from '$lib/schemas/settings';
import { FileStore } from '$lib/storage/file-store';
import type { AllSettings } from '$types/settings';

export class SettingsStore extends FileStore<AllSettings> {
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

  setLanguage(language: Locale) {
    this.set((settings) => {
      settings.app ??= {};
      settings.app.language = language;
      return settings;
    });
  }
}
