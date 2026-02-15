<script lang="ts" module>
  import { writable } from 'svelte/store';

  export const sidebarOpen = writable(false);
</script>

<script lang="ts">
  import AccountSwitcher from '$components/layout/sidebar/AccountSwitcher.svelte';
  import { Button } from '$components/ui/button';
  import { ExternalLink } from '$components/ui/external-link';
  import { getVersion } from '@tauri-apps/api/app';
  import { Separator } from '$components/ui/separator';
  import { platform } from '@tauri-apps/plugin-os';
  import { t } from '$lib/i18n';
  import { cn } from '$lib/utils';
  import { page } from '$app/state';
  import { SidebarCategories } from '$lib/constants/sidebar';
  import { settingsStore } from '$lib/storage';

  const currentPlatform = platform();
  const isMobile = currentPlatform === 'android' || currentPlatform === 'ios';

  const externalLinks = $derived([
    {
      name: $t('sidebar.externalLinks.discord'),
      href: 'https://discord.gg/rAUbXf5xUZ',
      icon: '/icons/discord.svg'
    },
    {
      name: $t('sidebar.externalLinks.repository'),
      href: 'https://github.com/bur4ky/spitfire-launcher',
      icon: '/icons/github.svg'
    }
  ]);

  function isCategoryVisible(key: string) {
    return SidebarCategories
      .find((category) => category.key === key)
      ?.items.some((item) => isItemVisible(item.key));
  }

  function isItemVisible(key: string) {
    const menu = ($settingsStore.customizableMenu || {}) as Record<string, boolean>;
    return menu[key] !== false;
  }
</script>

<div
  class="fixed inset-0 bg-black/50 z-40 lg:hidden" class:block={$sidebarOpen} class:hidden={!$sidebarOpen}
  onclick={() => sidebarOpen.set(false)}
  onkeydown={(e) => e.key === 'Escape' && sidebarOpen.set(false)}
  role="button"
  tabindex="0"
></div>

<aside
  class={cn(
    'w-60 sm:w-64 h-screen bg-card flex flex-col overflow-hidden select-none',
    'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
    'lg:sticky lg:top-0 lg:translate-x-0',
    $sidebarOpen ? 'translate-x-0' : '-translate-x-full'
  )}
>
  <div
    class="flex items-center justify-center border-b border-r {isMobile ? 'pt-6 h-22' : 'h-16'}"
    data-tauri-drag-region
  >
    <a class="max-xs:text-xl text-2xl font-bold" href="/">Spitfire Launcher</a>
  </div>

  <nav class="flex-1 overflow-y-auto py-4 border-r">
    <div class="space-y-4 px-3">
      {#each SidebarCategories as category (category.key)}
        {#if isCategoryVisible(category.key)}
          <div>
            <p class="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              {$t(`sidebar.categories.${category.key}`)}
            </p>

            <div class="space-y-0.5">
              {#each category.items as item (item.key)}
                {#if isItemVisible(item.key)}
                  <Button
                    class={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-normal justify-start',
                      page.url.pathname === item.href
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                    )}
                    href={item.href}
                    onclick={() => sidebarOpen.set(false)}
                    variant="ghost"
                  >
                    <item.icon class="size-4" />
                    {$t(`${item.key}.page.title`)}
                  </Button>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </nav>

  <div class="border-t space-y-2 p-3">
    <AccountSwitcher />

    <div class="flex items-center justify-center gap-4 border-t pt-2">
      <div class="flex items-center gap-3">
        {#each externalLinks as link (link.name)}
          <ExternalLink
            class="text-muted-foreground"
            href={link.href}
          >
            <img class="size-5" alt={link.name} src={link.icon} />
          </ExternalLink>
        {/each}
      </div>

      <Separator class="h-4" orientation="vertical" />

      {#await getVersion()}
        <!-- -->
      {:then version}
        <ExternalLink
          class="text-muted-foreground text-xs hover:underline"
          href="https://github.com/bur4ky/spitfire-launcher/releases/tag/v{version}"
        >
          {$t('sidebar.version')} v{version}
        </ExternalLink>
      {/await}
    </div>
  </div>
</aside>
