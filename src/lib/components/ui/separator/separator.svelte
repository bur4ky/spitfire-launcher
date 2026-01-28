<script lang="ts">
  import { cn } from '$lib/utils';
  import { Separator as SeparatorPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    class: className,
    'data-slot': dataSlot = 'separator',
    ...restProps
  }: SeparatorPrimitive.RootProps = $props();
</script>

<SeparatorPrimitive.Root
  {...restProps}
  class={cn(
    "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:min-h-full data-[orientation=vertical]:w-px",
    className
  )}
  data-slot={dataSlot}
  bind:ref
/>
