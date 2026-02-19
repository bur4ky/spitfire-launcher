<script lang="ts">
  import GeneralSettings from '$components/modules/settings/categories/GeneralSettings.svelte';
  import CustomizableMenu from '$components/modules/settings/categories/CustomizableMenu.svelte';
  import DownloaderSettings from '$components/modules/settings/categories/DownloaderSettings.svelte';
  import * as Tabs from '$components/ui/tabs';
  import type { LucideIcon } from '$types';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import CodeXmlIcon from '@lucide/svelte/icons/code-xml';
  import SlidersVertical from '@lucide/svelte/icons/sliders-vertical';
  import { platform } from '@tauri-apps/plugin-os';
  import type { Component } from 'svelte';
  import { Separator } from '$components/ui/separator';
  import PageContent from '$components/layout/PageContent.svelte';
  import AdvancedSettings from '$components/modules/settings/categories/AdvancedSettings.svelte';
  import { t } from '$lib/i18n';

  type Category = {
    id: string;
    name: string;
    icon: LucideIcon;
    component: Component;
  };

  const categories = $derived<Category[]>(
    [
      {
        id: 'general',
        name: $t('settings.tabs.general'),
        icon: SettingsIcon,
        component: GeneralSettings
      },
      {
        id: 'customizableMenu',
        name: $t('settings.tabs.customizableMenu'),
        icon: SlidersVertical,
        component: CustomizableMenu
      },
      platform() === 'windows' && {
        id: 'downloader',
        name: $t('settings.tabs.downloader'),
        icon: DownloadIcon,
        component: DownloaderSettings
      },
      {
        id: 'advanced',
        name: $t('settings.tabs.advanced'),
        icon: CodeXmlIcon,
        component: AdvancedSettings
      }
    ].filter((x) => !!x)
  );
</script>

<PageContent>
  <Tabs.Root class="flex flex-col" value={categories[0].id}>
    <Tabs.List>
      {#each categories as category (category.id)}
        <Tabs.Trigger class="flex items-center justify-center gap-2" value={category.id}>
          <category.icon class="size-4 not-sm:size-5" />
          <span class="not-sm:hidden">
            {category.name}
          </span>
        </Tabs.Trigger>
      {/each}
    </Tabs.List>

    <Separator class="mb-2" />

    {#each categories as category (category.id)}
      <Tabs.Content class="flex-1 overflow-y-auto rounded-md border bg-card p-4" value={category.id}>
        <category.component />
      </Tabs.Content>
    {/each}
  </Tabs.Root>
</PageContent>
