<script lang="ts">
  import { cn, type WithElementRef } from '$lib/utils.js';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    children,
    class: className,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLLIElement>> = $props();
</script>

<li
  bind:this={ref}
  class={cn('group/menu-sub-item relative', className)}
  data-sidebar="menu-sub-item"
  data-slot="sidebar-menu-sub-item"
  {...restProps}
>
  {@render children?.()}
</li>
