<script lang="ts">
  import { cn, type WithElementRef } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {} = $props();
</script>

<div
  {...restProps}
  bind:this={ref}
  class={cn('px-2 py-1.5 text-xs text-muted-foreground', className)}
  data-slot="select-label"
>
  {@render children?.()}
</div>
