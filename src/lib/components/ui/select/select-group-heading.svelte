<script lang="ts">
  import { cn } from '$lib/utils';
  import { Select as SelectPrimitive } from 'bits-ui';
  import type { ComponentProps } from 'svelte';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: ComponentProps<typeof SelectPrimitive.GroupHeading> = $props();
</script>

<SelectPrimitive.GroupHeading
  {...restProps}
  class={cn('px-2 py-1.5 text-xs text-muted-foreground', className)}
  data-slot="select-group-heading"
  bind:ref
>
  {@render children?.()}
</SelectPrimitive.GroupHeading>
