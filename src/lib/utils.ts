import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { t } from '$lib/i18n';
import { logger } from '$lib/logger';
import { accountStore } from '$lib/storage';
import type { AccountData } from '$types/account';
import type { FullQueryProfile } from '$types/game/mcp';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function calculateVbucks(queryProfile: FullQueryProfile<'common_core'>) {
  const profile = queryProfile.profileChanges[0].profile;
  const vbucksPlatform = profile.stats.attributes.current_mtx_platform;
  const vbucksItems = Object.values(profile.items).filter(
    (x) =>
      x.templateId.startsWith('Currency:Mtx') &&
      !(vbucksPlatform === 'Nintendo' && x.attributes.platform !== 'Nintendo')
  );

  return vbucksItems.reduce((acc, x) => acc + x.quantity, 0);
}

type HandleErrorOptions = {
  error: unknown;
  message: string;
  // Optional toast identifier used to update an existing toast.
  // If `false`, no toast will be shown.
  // If omitted, a new toast will be created.
  toastId?: string | number | false;
  account?: AccountData | string;
};

export function handleError({ error, message, toastId, account } = {} as HandleErrorOptions) {
  const accountId = typeof account === 'string' ? account : account?.accountId;
  logger.error(message, { accountId, error });

  if (toastId !== false) {
    toast.error(message, { id: toastId });
  }
}

export function formatRemainingDuration(ms: number) {
  const translate = get(t);
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  const parts = [];

  if (days) {
    const key = days === 1 ? 'one' : 'other';
    parts.push(translate(`times.days.${key}`, { count: days }));
  }

  if (hours) {
    const key = hours === 1 ? 'one' : 'other';
    parts.push(translate(`times.hours.${key}`, { count: hours }));
  }

  if (minutes) {
    const key = minutes === 1 ? 'one' : 'other';
    parts.push(translate(`times.minutes.${key}`, { count: minutes }));
  }

  if (seconds) {
    const key = seconds === 1 ? 'one' : 'other';
    parts.push(translate(`times.seconds.${key}`, { count: seconds }));
  }

  return parts.length ? parts.join(' ') : translate('times.seconds.other', { count: 0 });
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processChunks<T, R>(
  items: T[],
  chunkSize: number,
  fn: (chunk: T[]) => Promise<R[]>
): Promise<R[]> {
  const promises = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    promises.push(fn(chunk).catch(() => []));
  }

  const results = await Promise.allSettled(promises);
  const processedResults: R[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      processedResults.push(...result.value);
    }
  }

  return processedResults;
}

export function getAccountsFromSelection(selection: string[]): AccountData[] {
  const { accounts } = accountStore.get();
  return selection.map((id) => accounts.find((account) => account.accountId === id)).filter((x) => !!x);
}

export function bytesToSize(bytes: number, decimals = 2, unit = 1000) {
  if (bytes <= 0) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(unit));
  return `${(bytes / Math.pow(unit, i)).toFixed(decimals)} ${sizes[i]}`;
}
