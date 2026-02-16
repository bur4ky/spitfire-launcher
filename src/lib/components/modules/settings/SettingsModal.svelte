<script lang="ts">
  import AppSettings from '$components/modules/settings/categories/AppSettings.svelte';
  import CustomizableMenu from '$components/modules/settings/categories/CustomizableMenu.svelte';
  import DownloaderSettings from '$components/modules/settings/categories/DownloaderSettings.svelte';
  import { Button } from '$components/ui/button';
  import * as Dialog from '$components/ui/dialog';
  import { t } from '$lib/i18n';
  import { cn } from '$lib/utils';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import { platform } from '@tauri-apps/plugin-os';
  import type { Component } from 'svelte';

  const categories = $derived.by(() => {
    const categories: { id: string; name: string; component: Component }[] = [
      { id: 'appSettings', name: $t('settings.tabs.appSettings'), component: AppSettings },
      { id: 'customizableMenu', name: $t('settings.tabs.customizableMenu'), component: CustomizableMenu }
    ];

    if (platform() === 'windows') {
      categories.push({
        id: 'downloaderSettings',
        name: $t('settings.tabs.downloaderSettings'),
        component: DownloaderSettings
      });
    }

    return categories;
  });

  // svelte-ignore state_referenced_locally
  let activeTab = $state(categories[0].id);
</script>

<Dialog.Root>
  <Dialog.Trigger class="rounded-md p-2 hover:bg-accent">
    <SettingsIcon class="size-6" />
  </Dialog.Trigger>

  <Dialog.Content class="flex !max-w-[calc(100%-2rem)] flex-col max-xs:w-full sm:!max-w-200 sm:flex-row">
    <div class="sm:w-50 sm:border-r sm:pr-6">
      <div class="mb-2 flex flex-wrap gap-2 sm:mb-0 sm:flex-col sm:flex-nowrap">
        {#each categories as category (category.id)}
          <Button
            class={cn('w-full justify-start', activeTab === category.id && 'bg-accent')}
            onclick={() => (activeTab = category.id)}
            variant="ghost"
          >
            {category.name}
          </Button>
        {/each}
      </div>
    </div>

    <div class="max-h-114 min-h-114 flex-1 overflow-y-auto max-xs:h-128">
      <div>
        {#each categories as category (category.id)}
          {#if activeTab === category.id}
            <category.component />
          {/if}
        {/each}
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
