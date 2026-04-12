<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Combobox as ComboboxPrimitive } from 'bits-ui';
  import { cn } from '$lib/utils';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: ComponentProps<typeof ComboboxPrimitive.GroupHeading> = $props();
</script>

<ComboboxPrimitive.GroupHeading
  {...restProps}
  class={cn('px-2 py-1.5 text-xs text-muted-foreground', className)}
  data-slot="combobox-group-heading"
  bind:ref
>
  {@render children?.()}
</ComboboxPrimitive.GroupHeading>
