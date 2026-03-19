import { dev } from '$app/environment';
import type { Locale } from '$lib/paraglide/runtime';
import { allSettingsSchema } from '$lib/schemas/settings';
import { FileStore } from '$lib/storage/file-store';
import type { AllSettings } from '$types/settings';

export class SettingsStore extends FileStore<AllSettings> {
  constructor() {
    super(
      'settings',
      {
        app: {
          language: dev ? 'en' : null,
          claimRewardsDelay: 1.5,
          missionCheckInterval: 5,
          startingPage: 'stwMissionAlerts',
          discordStatus: !dev,
          hideToTray: false,
          checkForUpdates: !dev,
          debugLogs: dev
        }
      },
      allSettingsSchema
    );
  }

  setLanguage(language: Locale) {
    this.set((settings) => {
      settings.app ??= {};
      settings.app.language = language;
      return settings;
    });
  }
}
