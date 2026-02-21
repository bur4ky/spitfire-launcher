<script lang="ts">
  import AccountSwitcher from '$components/layout/sidebar/AccountSwitcher.svelte';
  import { ExternalLink } from '$components/ui/external-link';
  import { Separator } from '$components/ui/separator';
  import { Button } from '$components/ui/button';
  import * as Sidebar from '$components/ui/sidebar';
  import * as Tooltip from '$components/ui/tooltip';
  import { page } from '$app/state';
  import { SidebarCategories } from '$lib/constants/sidebar';
  import { accountStore, settingsStore } from '$lib/storage';
  import { cn } from '$lib/utils';
  import { t } from '$lib/i18n';
  import { getVersion } from '@tauri-apps/api/app';

  const sidebar = Sidebar.useSidebar();
  const activeAccount = accountStore.getActiveStore(true);

  function isCategoryVisible(key: string) {
    return SidebarCategories.find((c) => c.key === key)?.items.some((item) => isItemVisible(item.key));
  }

  function isItemVisible(key: string) {
    const menu = ($settingsStore.customizableMenu || {}) as Record<string, boolean>;
    return menu[key] !== false;
  }

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
</script>

<Sidebar.Root>
  <Sidebar.Header class="flex h-[calc(4rem+env(safe-area-inset-top))] items-center justify-center border-r border-b">
    <a class="pt-safe text-2xl font-bold select-none" href="/">Spitfire Launcher</a>
  </Sidebar.Header>

  <Sidebar.Content class="gap-0">
    {#each SidebarCategories as category (category.key)}
      {#if isCategoryVisible(category.key)}
        <Sidebar.Group>
          <Sidebar.GroupLabel class="tracking-wider text-muted-foreground/60 uppercase">
            {$t(`sidebar.categories.${category.key}`)}
          </Sidebar.GroupLabel>

          <Sidebar.Menu>
            {#each category.items as item (item.key)}
              {#if isItemVisible(item.key)}
                {@const isActive = page.url.pathname === item.href}
                {@const isDisabled = item.requiresLogin && !$activeAccount}

                <Sidebar.MenuItem>
                  <Sidebar.MenuButton {isActive}>
                    {#snippet child({ props })}
                      <Tooltip.Root>
                        <Tooltip.Trigger class="w-full {isDisabled && 'cursor-default'}">
                          <Button
                            {...props}
                            class={cn(
                              'h-7 w-full justify-start px-3 py-1 text-sm font-normal',
                              isActive
                                ? 'bg-accent text-accent-foreground'
                                : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                            )}
                            disabled={isDisabled}
                            href={item.href}
                            onclick={() => sidebar.setOpenMobile(false)}
                            size="sm"
                            variant="ghost"
                          >
                            <item.icon class="size-4" />
                            {$t(`${item.key}.page.title`)}
                          </Button>
                        </Tooltip.Trigger>

                        {#if isDisabled}
                          <Tooltip.Content>{$t('sidebar.loginRequired')}</Tooltip.Content>
                        {/if}
                      </Tooltip.Root>
                    {/snippet}
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
              {/if}
            {/each}
          </Sidebar.Menu>
        </Sidebar.Group>
      {/if}
    {/each}
  </Sidebar.Content>

  <Sidebar.Footer class="border-t">
    <AccountSwitcher />

    <div class="pb-safe flex items-center justify-center gap-4 border-t pt-2">
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
  </Sidebar.Footer>
</Sidebar.Root>
