<script lang="ts">
  import type { Separator as SeparatorPrimitive } from "bits-ui";
  import { Separator } from "$components/ui/separator/index.js";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: SeparatorPrimitive.RootProps = $props();
</script>

<Separator
  class={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
  data-slot="select-separator"
  bind:ref
  {...restProps}
/>
