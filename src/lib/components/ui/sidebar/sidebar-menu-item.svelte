<script lang="ts">
  import { cn, type WithElementRef } from '$lib/utils.js';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLLIElement>, HTMLLIElement> = $props();
</script>

<li
  bind:this={ref}
  class={cn('group/menu-item relative', className)}
  data-sidebar="menu-item"
  data-slot="sidebar-menu-item"
  {...restProps}
>
  {@render children?.()}
</li>
