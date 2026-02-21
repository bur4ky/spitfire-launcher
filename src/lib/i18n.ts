import { m } from '$lib/paraglide/messages';
import { baseLocale, type Locale } from '$lib/paraglide/runtime';
import { settingsStore } from '$lib/storage';
import { derived } from 'svelte/store';

type MessageKey = keyof typeof m;
type MessageFn<K extends MessageKey> = (typeof m)[K];
type InputsOf<K extends MessageKey> = Parameters<MessageFn<K>>[0];
type OptionsOf<K extends MessageKey> = Parameters<MessageFn<K>>[1];

export const language = derived(
  settingsStore,
  ($settingsStore) => $settingsStore.app?.language ?? baseLocale,
  baseLocale as Locale
);

export const t = derived(language, ($language) => {
  return function t<K extends MessageKey>(key: K, inputs?: InputsOf<K>, options?: OptionsOf<K>): string {
    return m[key](inputs ?? ({} as any), {
      locale: $language,
      ...options
    }) as ReturnType<MessageFn<K>>;
  };
});
