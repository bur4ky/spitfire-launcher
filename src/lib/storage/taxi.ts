import { taxiSettingsSchema } from '$lib/schemas/settings';
import { FileStore } from '$lib/storage/file-store';
import type { TaxiSettings } from '$types/settings';

export class TaxiStore extends FileStore<TaxiSettings> {
  constructor() {
    super('taxi', [], taxiSettingsSchema);
  }
}
