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
    return SidebarCategories.find((category) => category.key === key)?.items.some((item) => isItemVisible(item.key));
  }

  function isItemVisible(key: string) {
    const menu = ($settingsStore.customizableMenu || {}) as Record<string, boolean>;
    return menu[key] !== false;
  }
</script>

<div
  class="fixed inset-0 z-40 bg-black/50 lg:hidden"
  class:block={$sidebarOpen}
  class:hidden={!$sidebarOpen}
  onclick={() => sidebarOpen.set(false)}
  onkeydown={(e) => e.key === 'Escape' && sidebarOpen.set(false)}
  role="button"
  tabindex="0"
></div>

<aside
  class={cn(
    'flex h-screen w-60 flex-col overflow-hidden bg-card select-none sm:w-64',
    'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
    'lg:sticky lg:top-0 lg:translate-x-0',
    $sidebarOpen ? 'translate-x-0' : '-translate-x-full'
  )}
>
  <div
    class="flex items-center justify-center border-r border-b {isMobile ? 'h-22 pt-6' : 'h-16'}"
    data-tauri-drag-region
  >
    <a class="text-2xl font-bold max-xs:text-xl" href="/">Spitfire Launcher</a>
  </div>

  <nav class="flex-1 overflow-y-auto border-r py-4">
    <div class="space-y-4 px-3">
      {#each SidebarCategories as category (category.key)}
        {#if isCategoryVisible(category.key)}
          <div>
            <p class="mb-1.5 px-3 text-xs font-semibold tracking-wider text-muted-foreground/60 uppercase">
              {$t(`sidebar.categories.${category.key}`)}
            </p>

            <div class="space-y-0.5">
              {#each category.items as item (item.key)}
                {#if isItemVisible(item.key)}
                  <Button
                    class={cn(
                      'flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2 text-sm font-normal',
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

  <div class="space-y-2 border-t p-3">
    <AccountSwitcher />

    <div class="flex items-center justify-center gap-4 border-t pt-2">
      <div class="flex items-center gap-3">
        {#each externalLinks as link (link.name)}
          <ExternalLink class="text-muted-foreground" href={link.href}>
            <img class="size-5" alt={link.name} src={link.icon} />
          </ExternalLink>
        {/each}
      </div>

      <Separator class="h-4" orientation="vertical" />

      {#await getVersion()}
        <!-- -->
      {:then version}
        <ExternalLink
          class="text-xs text-muted-foreground hover:underline"
          href="https://github.com/bur4ky/spitfire-launcher/releases/tag/v{version}"
        >
          {$t('sidebar.version')} v{version}
        </ExternalLink>
      {/await}
    </div>
  </div>
</aside>
