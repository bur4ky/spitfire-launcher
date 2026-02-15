import { deviceAuthsSettingsSchema } from '$lib/schemas/settings';
import { FileStore } from '$lib/storage/file-store';
import type { DeviceAuthsSettings } from '$types/settings';

export class DeviceAuthsStore extends FileStore<DeviceAuthsSettings> {
  constructor() {
    super('device-auths', [], deviceAuthsSettingsSchema);
  }

  setName(deviceId: string, name: string) {
    this.set((settings) => {
      const index = settings.findIndex((x) => x.deviceId === deviceId);
      if (index !== -1) {
        settings[index].customName = name;
      } else {
        settings.push({
          deviceId,
          customName: name
        });
      }

      return settings;
    });
  }

  remove(deviceId: string) {
    this.set((settings) => {
      return settings.filter((x) => x.deviceId !== deviceId);
    });
  }
}