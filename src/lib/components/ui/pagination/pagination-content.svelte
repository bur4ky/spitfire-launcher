<script lang="ts">
  import { cn, type WithElementRef } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLUListElement>> = $props();
</script>

<ul
  {...restProps}
  bind:this={ref}
  class={cn('flex flex-row items-center gap-1', className)}
  data-slot="pagination-content"
>
  {@render children?.()}
</ul>
