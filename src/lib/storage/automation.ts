import { automationSettingsSchema } from '$lib/schemas/settings';
import { FileStore } from '$lib/storage/file-store';
import type { AutomationSettings } from '$types/settings';

export class AutomationStore extends FileStore<AutomationSettings> {
  constructor() {
    super('automation', [], automationSettingsSchema);
  }
}