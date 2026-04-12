<script lang="ts">
  import { SidebarCategories, type SidebarItem } from '$lib/constants/sidebar';
  import { t } from '$lib/i18n';
  import { settingsStore } from '$lib/storage';
  import { Label } from '$components/ui/label';
  import { Separator } from '$components/ui/separator';
  import { Switch } from '$components/ui/switch';

  const categories = SidebarCategories.filter((x) => !x.hidden);

  function isItemEnabled(id: SidebarItem['id']) {
    const menu = $settingsStore.customizableMenu;
    return menu?.[id] !== false;
  }

  function setVisibility(id: SidebarItem['id'], value: boolean) {
    settingsStore.set((settings) => ({
      ...settings,
      customizableMenu: {
        ...settings.customizableMenu,
        [id]: value
      }
    }));
  }
</script>

<div class="space-y-6">
  {#each categories as category (category.id)}
    <div>
      <h2 class="text-lg font-semibold">
        {$t(`sidebar.categories.${category.id}`)}
      </h2>

      <Separator class="mb-2" orientation="horizontal" />

      <div class="grid grid-cols-1 gap-x-3 gap-y-1 xs:grid-cols-2">
        {#each category.items as item (item.id)}
          <div class="flex items-center justify-between">
            <Label class="flex-1 text-sm font-normal" for={item.id}>
              {$t(`${item.id}.page.title`)}
            </Label>

            <Switch
              id={item.id}
              checked={isItemEnabled(item.id)}
              onCheckedChange={(checked) => setVisibility(item.id, checked)}
            />
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>
