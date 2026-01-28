import FileStore from '$lib/storage/file-store';
import type { AutomationSettings } from '$types/settings';
import { automationSettingsSchema } from '$lib/schemas/settings';

export default class AutomationStore extends FileStore<AutomationSettings> {
  constructor() {
    super('automation', [], automationSettingsSchema);
  }
}