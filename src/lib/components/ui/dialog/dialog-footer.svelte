<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '$lib/utils';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  {...restProps}
  bind:this={ref}
  class={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
  data-slot="dialog-footer"
>
  {@render children?.()}
</div>
