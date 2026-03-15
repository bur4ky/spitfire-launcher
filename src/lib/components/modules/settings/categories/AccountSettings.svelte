<script lang="ts">
  import SettingItem from '$components/modules/settings/SettingItem.svelte';
  import { Sortable } from '$components/ui/sortable';
  import { accountStore } from '$lib/storage';
  import { t } from '$lib/i18n';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';

  const accounts = $derived($accountStore.accounts);

  function applyReorder(from: number, insertBefore: number) {
    const to = insertBefore > from ? insertBefore - 1 : insertBefore;
    if (from === to) return;
    accountStore.set((current) => {
      const next = [...current.accounts];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      current.accounts = next;
      return current;
    });
  }

  function moveUp(index: number) {
    if (index > 0) applyReorder(index, index - 1);
  }

  function moveDown(index: number) {
    if (index < accounts.length - 1) applyReorder(index, index + 2);
  }
</script>

<div class="space-y-6">
  <SettingItem
    description={$t('settings.accounts.accountOrder.description')}
    orientation="vertical"
    title={$t('settings.accounts.accountOrder.title')}
  >
    <Sortable
      class="flex flex-col gap-2"
      keyFn={(a) => a.accountId}
      bind:items={() => accounts, (next) => accountStore.set((c) => ({ ...c, accounts: next }))}
    >
      {#snippet children({ item, index, isDragging, handleProps })}
        <li class="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2 select-none">
          <GripVerticalIcon
            class={['size-4 shrink-0 text-muted-foreground', isDragging ? 'cursor-grabbing' : 'cursor-grab'].join(' ')}
            {...handleProps}
          />
          <span class="flex-1 truncate text-sm font-medium">{item.displayName}</span>
          <div class="flex items-center gap-1">
            <button
              class="rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={$t('settings.accounts.accountOrder.moveUp')}
              disabled={index === 0}
              onclick={() => moveUp(index)}
              type="button"
            >
              <ArrowUpIcon class="size-3.5" />
            </button>
            <button
              class="rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={$t('settings.accounts.accountOrder.moveDown')}
              disabled={index === accounts.length - 1}
              onclick={() => moveDown(index)}
              type="button"
            >
              <ArrowDownIcon class="size-3.5" />
            </button>
          </div>
        </li>
      {/snippet}
    </Sortable>
  </SettingItem>
</div>
