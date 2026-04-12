<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  class={cn('w-full text-sm', className)}
  data-sidebar="group-content"
  data-slot="sidebar-group-content"
  {...restProps}
>
  {@render children?.()}
</div>
