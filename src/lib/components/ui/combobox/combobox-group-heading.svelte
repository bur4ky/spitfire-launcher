<script lang="ts">
  import { cn } from '$lib/utils';
  import { Combobox as ComboboxPrimitive } from 'bits-ui';
  import type { ComponentProps } from 'svelte';

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
