<script lang="ts">
  import LanguagesIcon from '@lucide/svelte/icons/languages';
  import CheckIcon from '@lucide/svelte/icons/check';
  import type { Locale } from '$lib/paraglide/runtime';
  import * as DropdownMenu from '$components/ui/dropdown-menu';
  import { changeLocale, t } from '$lib/utils';
  import { language } from '$lib/storage';

  const locales: { locale: Locale; country: string }[] = [
    { locale: 'de', country: 'germany' },
    { locale: 'en', country: 'usa' },
    { locale: 'es', country: 'spain' },
    { locale: 'fr', country: 'france' },
    { locale: 'pt-br', country: 'portugal' },
    { locale: 'tr', country: 'turkey' }
  ];
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class="p-2 rounded-md hover:bg-accent">
    <LanguagesIcon class="size-6"/>
  </DropdownMenu.Trigger>

  <DropdownMenu.Content>
    {#each locales as { locale, country } (locale)}
      <DropdownMenu.Item
        class="flex items-center gap-2 min-w-40"
        onclick={() => changeLocale(locale)}
      >
        <img class="size-7 rounded-sm" alt={country} src="/flags/{country}.svg" />
        <span class="truncate">{$t('language', {}, { locale })}</span>

        {#if $language === locale}
          <span class="ml-auto">
            <CheckIcon class="size-4"/>
          </span>
        {/if}
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
