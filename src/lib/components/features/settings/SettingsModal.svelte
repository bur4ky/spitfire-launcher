<script lang="ts">
  import * as Dialog from '$components/ui/dialog';
  import { Button } from '$components/ui/button';
  import DownloaderSettings from '$components/features/settings/categories/DownloaderSettings.svelte';
  import AppSettings from '$components/features/settings/categories/AppSettings.svelte';
  import CustomizableMenu from '$components/features/settings/categories/CustomizableMenu.svelte';
  import { platform as getPlatform } from '@tauri-apps/plugin-os';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import { cn, t } from '$lib/utils';
  import type { Component } from 'svelte';

  const platform = getPlatform();

  const categories = $derived.by(() => {
    const categories: { id: string; name: string; component: Component }[] = [
      { id: 'appSettings', name: $t('settings.tabs.appSettings'), component: AppSettings },
      { id: 'customizableMenu', name: $t('settings.tabs.customizableMenu'), component: CustomizableMenu }
    ];

    if (platform === 'windows') {
      categories.push({ id: 'downloaderSettings', name: $t('settings.tabs.downloaderSettings'), component: DownloaderSettings });
    }

    return categories;
  });

  // svelte-ignore state_referenced_locally
  let activeTab = $state(categories[0].id);
</script>

<Dialog.Root>
  <Dialog.Trigger class="p-2 rounded-md hover:bg-accent">
    <SettingsIcon class="size-6"/>
  </Dialog.Trigger>

  <Dialog.Content class="!max-w-[calc(100%-2rem)] sm:!max-w-200 max-xs:w-full flex flex-col sm:flex-row">
    <div class="sm:w-50 sm:pr-6 sm:border-r">
      <div class="flex flex-wrap sm:flex-nowrap sm:flex-col gap-2 mb-2 sm:mb-0">
        {#each categories as category (category.id)}
          <Button
            class={cn(
              'w-full justify-start',
              activeTab === category.id && 'bg-accent'
            )}
            onclick={() => (activeTab = category.id)}
            variant="ghost"
          >
            {category.name}
          </Button>
        {/each}
      </div>
    </div>

    <div class="flex-1 min-h-114 max-h-114 max-xs:h-128 overflow-y-auto">
      <div>
        {#each categories as category (category.id)}
          {#if activeTab === category.id}
            <category.component/>
          {/if}
        {/each}
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
