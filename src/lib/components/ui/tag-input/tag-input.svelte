<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';

  type Props = {
    items?: string[];
    placeholder?: string;
  };

  let { items = $bindable<string[]>([]), placeholder = 'Enter items and press Enter' }: Props = $props();

  let currentInput = $state<string>();

  function addItem(input: string) {
    if (items.includes(input)) return;

    items = [...items, input];
    currentInput = '';
  }

  function removeItem(index: number, event?: MouseEvent) {
    event?.stopPropagation();
    items = items.filter((_, i) => i !== index);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();

      const input = currentInput?.trim();
      if (input) addItem(input);
    }

    if (e.key === 'Backspace' && !currentInput && items.length) {
      removeItem(items.length - 1);
    }
  }
</script>

<div class="flex w-full flex-col gap-2">
  <div class="relative flex cursor-text flex-wrap items-center gap-2 overflow-hidden rounded-md border bg-card p-2">
    {#each items as item, i (i)}
      <div
        class="flex max-w-full cursor-default items-center gap-2 rounded-md bg-muted px-1 py-0.5 text-sm select-none"
      >
        <span class="overflow-hidden break-words whitespace-normal">{item}</span>
        <button
          class="ml-auto shrink-0 text-muted-foreground hover:text-foreground"
          onclick={(e) => removeItem(i, e)}
          type="button"
        >
          <XIcon class="size-4" />
        </button>
      </div>
    {/each}

    <textarea
      class="field-sizing-content resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      class:min-w-20={items.length}
      class:min-w-full={!items.length}
      onkeydown={handleKeyDown}
      placeholder={items.length ? '' : placeholder}
      rows="1"
      bind:value={currentInput}
    ></textarea>
  </div>
</div>
