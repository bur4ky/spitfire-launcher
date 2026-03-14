<script lang="ts">
  import SettingItem from '$components/modules/settings/SettingItem.svelte';
  import { accountStore } from '$lib/storage';
  import { t } from '$lib/i18n';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import type { AccountData } from '$types/account';

  let localAccounts = $state<AccountData[]>([]);

  $effect(() => {
    localAccounts = [...$accountStore.accounts];
  });

  let draggedIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);
  let currentOnPointerEnter = $state<((index: number) => void) | null>(null);

  function applyReorder(from: number, to: number) {
    const next = [...localAccounts];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    localAccounts = next;
    accountStore.reorder(next.map((a) => a.accountId));
  }

  function handlePointerDown(e: PointerEvent, index: number) {
    e.preventDefault();
    draggedIndex = index;

    currentOnPointerEnter = (enterIndex: number) => {
      if (draggedIndex !== null && draggedIndex !== enterIndex) {
        dragOverIndex = enterIndex;
      }
    };

    function onPointerUp() {
      if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
        applyReorder(draggedIndex, dragOverIndex);
      }
      draggedIndex = null;
      dragOverIndex = null;
      currentOnPointerEnter = null;
      window.removeEventListener('pointerup', onPointerUp);
    }

    window.addEventListener('pointerup', onPointerUp);
  }

  function moveUp(index: number) {
    if (index > 0) applyReorder(index, index - 1);
  }

  function moveDown(index: number) {
    if (index < localAccounts.length - 1) applyReorder(index, index + 1);
  }
</script>

<div class="space-y-6">
  <SettingItem
    description={$t('settings.accountOrder.description')}
    orientation="vertical"
    title={$t('settings.accountOrder.title')}
  >
    {#if localAccounts.length === 0}
      <p class="text-muted-foreground text-sm">{$t('settings.accountOrder.noAccounts')}</p>
    {:else}
      <ul class="flex flex-col gap-1">
        {#each localAccounts as account, index (account.accountId)}
          <li
            role="listitem"
            onpointerenter={() => currentOnPointerEnter?.(index)}
            class={[
              'flex items-center gap-3 rounded-md border bg-card px-3 py-2 transition-colors select-none',
              draggedIndex === index ? 'opacity-40' : '',
              dragOverIndex === index && draggedIndex !== index
                ? 'border-primary bg-accent'
                : 'border-border'
            ].join(' ')}
          >
            <GripVerticalIcon
              class="text-muted-foreground size-4 shrink-0 cursor-grab active:cursor-grabbing"
              onpointerdown={(e) => handlePointerDown(e, index)}
            />

            <span class="flex-1 truncate text-sm font-medium">
              {account.displayName}
            </span>

            <div class="flex items-center gap-1">
              <button
                type="button"
                onclick={() => moveUp(index)}
                disabled={index === 0}
                class="text-muted-foreground hover:text-foreground rounded p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={$t('settings.accountOrder.moveUp')}
              >
                <ArrowUpIcon class="size-3.5" />
              </button>
              <button
                type="button"
                onclick={() => moveDown(index)}
                disabled={index === localAccounts.length - 1}
                class="text-muted-foreground hover:text-foreground rounded p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={$t('settings.accountOrder.moveDown')}
              >
                <ArrowDownIcon class="size-3.5" />
              </button>
            </div>
          </li>
        {/each}
      </ul>

      <p class="text-muted-foreground text-xs">{$t('settings.accountOrder.hint')}</p>
    {/if}
  </SettingItem>
</div>