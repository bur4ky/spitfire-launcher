<script lang="ts">
  import { cn, type WithElementRef } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

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
  class={cn("flex flex-col gap-2 text-center sm:text-start", className)}
  data-slot="dialog-header"
>
  {@render children?.()}
</div>
