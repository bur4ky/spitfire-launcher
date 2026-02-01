<script lang="ts">
  import { Label } from '$components/ui/label';
  import { Separator } from '$components/ui/separator';
  import { Switch } from '$components/ui/switch';
  import { SidebarCategories } from '$lib/constants/sidebar';
  import { t } from '$lib/i18n';
  import { settingsStore } from '$lib/storage';

  function isItemEnabled(key: string) {
    const menu = ($settingsStore.customizableMenu) as Record<string, boolean>;
    return menu?.[key] !== false;
  }

  function setVisibility(key: string, value: boolean) {
    settingsStore.set((settings) => ({
      ...settings,
      customizableMenu: {
        ...settings.customizableMenu,
        [key]: value
      }
    }));
  }
</script>

<div class="space-y-6">
  {#each SidebarCategories as category (category.key)}
    <div>
      <h2 class="text-lg font-semibold">
        {$t(`sidebar.categories.${category.key}`)}
      </h2>

      <Separator class="mb-2" orientation="horizontal" />

      <div class="grid grid-cols-1 xs:grid-cols-2 gap-y-1 gap-x-3">
        {#each category.items as item (item.key)}
          <div class="flex items-center justify-between">
            <Label class="flex-1 text-sm font-normal" for={item.key}>
              {$t(`${item.key}.page.title`)}
            </Label>

            <Switch
              id={item.key}
              checked={isItemEnabled(item.key)}
              onCheckedChange={(checked) => setVisibility(item.key, checked)}
            />
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>
