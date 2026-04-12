<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '$lib/utils';

  let {
    ref = $bindable(null),
    class: className,
    inset,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    inset?: boolean;
  } = $props();
</script>

<div
  {...restProps}
  bind:this={ref}
  class={cn('px-2 py-1.5 text-sm font-semibold data-[inset]:ps-8', className)}
  data-inset={inset}
  data-slot="dropdown-menu-label"
>
  {@render children?.()}
</div>
