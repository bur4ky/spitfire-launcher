<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';

  type Props = {
    items?: string[];
    placeholder?: string;
  };

  let {
    items = $bindable<string[]>([]),
    placeholder = 'Enter items and press Enter'
  }: Props = $props();

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

<div class="flex flex-col gap-2 w-full">
  <div class="relative border rounded-md p-2 flex flex-wrap gap-2 items-center cursor-text overflow-hidden bg-card">
    {#each items as item, i (i)}
      <div class="bg-muted flex items-center gap-2 px-1 py-0.5 rounded-md text-sm select-none cursor-default max-w-full">
        <span class="whitespace-normal break-words overflow-hidden">{item}</span>
        <button
          class="text-muted-foreground hover:text-foreground shrink-0 ml-auto"
          onclick={(e) => removeItem(i, e)}
          type="button"
        >
          <XIcon class="size-4" />
        </button>
      </div>
    {/each}

    <textarea
      class="outline-none resize-none bg-transparent field-sizing-content text-sm placeholder:text-muted-foreground"
      class:min-w-20={items.length}
      class:min-w-full={!items.length}
      onkeydown={handleKeyDown}
      placeholder={items.length ? '' : placeholder}
      rows="1"
      bind:value={currentInput}
    ></textarea>
  </div>
</div>