import FileStore from '$lib/storage/file-store';
import type { TaxiSettings } from '$types/settings';
import { taxiSettingsSchema } from '$lib/schemas/settings';

export default class TaxiStore extends FileStore<TaxiSettings> {
  constructor() {
    super('taxi', [], taxiSettingsSchema);
  }
}