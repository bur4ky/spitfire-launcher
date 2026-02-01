<script lang="ts">
  import { Separator } from '$components/ui/separator/index.js';
  import { cn } from '$lib/utils';
  import type { Separator as SeparatorPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: SeparatorPrimitive.RootProps = $props();
</script>

<Separator
  {...restProps}
  class={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
  data-slot="select-separator"
  bind:ref
/>
