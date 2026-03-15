<script generics="T" lang="ts">
  import type { Snippet } from 'svelte';
  import { on } from 'svelte/events';

  type ItemSnippetProps = {
    item: T;
    index: number;
    isDragging: boolean;
    handleProps: { onpointerdown: (e: PointerEvent) => void };
  };

  let {
    items = $bindable<T[]>(),
    keyFn,
    children: itemSnippet,
    class: className = ''
  }: {
    items: T[];
    keyFn: (item: T) => string | number;
    children: Snippet<[ItemSnippetProps]>;
    class?: string;
  } = $props();

  type DragState = {
    fromIndex: number;
    ghostTop: number;
    ghostLeft: number;
    ghostWidth: number;
    ghostHeight: number;
    cursorOffsetY: number;
    clonedEl: HTMLElement;
  };

  let drag = $state<DragState>();
  let dropIndex = $state<number>();
  let indicatorY = $state<number>();
  let listEl = $state<HTMLUListElement>();

  function getItemEls(): HTMLElement[] {
    return listEl ? Array.from(listEl.querySelectorAll<HTMLElement>('[data-sortable-index]')) : [];
  }

  function computeDrop(pointerY: number): { index: number; y: number } {
    const els = getItemEls();
    for (const el of els) {
      const rect = el.getBoundingClientRect();
      if (pointerY < rect.top + rect.height / 2) {
        return { index: Number(el.dataset.sortableIndex), y: rect.top };
      }
    }

    const last = els[els.length - 1];
    return { index: items.length, y: last?.getBoundingClientRect().bottom ?? 0 };
  }

  function reorder(from: number, insertBefore: number) {
    const to = insertBefore > from ? insertBefore - 1 : insertBefore;
    if (from === to) return;

    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    items = next;
  }

  function startDrag(e: PointerEvent, index: number) {
    e.preventDefault();

    const handle = e.currentTarget as HTMLElement;
    const li = handle.closest<HTMLElement>('[data-sortable-index]')!;
    const rect = li.getBoundingClientRect();

    const clone = li.cloneNode(true) as HTMLElement;
    clone.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      margin: 0;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.95;
      box-shadow: 0 8px 32px -4px rgb(0 0 0 / 0.2), 0 0 0 1px hsl(var(--primary) / 0.3);
      border-radius: inherit;
      transform: scale(1.02);
      transition: transform 0ms;
    `;
    document.body.appendChild(clone);
    handle.setPointerCapture(e.pointerId);

    drag = {
      fromIndex: index,
      ghostTop: rect.top,
      ghostLeft: rect.left,
      ghostWidth: rect.width,
      ghostHeight: rect.height,
      cursorOffsetY: e.clientY - rect.top,
      clonedEl: clone
    };

    const initial = computeDrop(e.clientY);
    dropIndex = initial.index;
    indicatorY = initial.y;

    const offMove = on(window, 'pointermove', (ev) => {
      if (!drag) return;

      const newTop = ev.clientY - drag.cursorOffsetY;
      drag.clonedEl.style.top = `${newTop}px`;

      const result = computeDrop(ev.clientY);
      dropIndex = result.index;
      indicatorY = result.y;
    });

    const offUp = on(window, 'pointerup', () => {
      if (drag != null && dropIndex != null) {
        reorder(drag.fromIndex, dropIndex);
      }

      drag?.clonedEl.remove();
      drag = undefined;
      dropIndex = undefined;
      indicatorY = undefined;

      offMove();
      offUp();
    });
  }
</script>

{#if drag && indicatorY != null && dropIndex !== drag.fromIndex && dropIndex !== drag.fromIndex + 1}
  <div
    style="top: {indicatorY}px; left: {drag.ghostLeft}px; width: {drag.ghostWidth}px; transform: translateY(-50%);"
    class="pointer-events-none fixed z-9998"
  >
    <div class="flex items-center gap-1">
      <div class="size-1.5 rounded-full bg-primary"></div>
      <div class="h-0.5 flex-1 rounded-full bg-primary"></div>
    </div>
  </div>
{/if}

<ul bind:this={listEl} class={className}>
  {#each items as item, index (keyFn(item))}
    <div class:opacity-50={drag?.fromIndex === index} data-sortable-index={index}>
      {@render itemSnippet({
        item,
        index,
        isDragging: drag?.fromIndex === index,
        handleProps: { onpointerdown: (e) => startDrag(e, index) }
      })}
    </div>
  {/each}
</ul>
