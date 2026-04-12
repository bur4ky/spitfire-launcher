<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '$lib/utils.js';

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
