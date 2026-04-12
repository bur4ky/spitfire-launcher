import { z } from 'zod';
import { accountDataFileSchema, accountDataSchema } from '$lib/schemas/account';

export type AccountData = z.infer<typeof accountDataSchema>;
export type AccountDataFile = z.infer<typeof accountDataFileSchema>;

export type BulkState<T> = {
  accountId: string;
  displayName: string;
  data: T;
};
