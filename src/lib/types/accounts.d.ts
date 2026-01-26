import { z } from 'zod';

import { accountDataFileSchema, accountDataSchema } from '$lib/validations/accounts';

export type AccountData = z.infer<typeof accountDataSchema>;
export type AccountDataFile = z.infer<typeof accountDataFileSchema>;

export type BulkState<T> = {
  accountId: string;
  displayName: string;
  data: T;
};

export type AccountStoreData = Partial<{
  vbucks: number;
  friends: { displayName: string; accountId: string }[];
  remainingGifts: number;
}>;