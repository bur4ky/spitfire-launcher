<script lang="ts">
  import { cn, type WithElementRef } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<span
  {...restProps}
  bind:this={ref}
  class={cn('ms-auto text-xs tracking-widest text-muted-foreground', className)}
  data-slot="dropdown-menu-shortcut"
>
  {@render children?.()}
</span>
