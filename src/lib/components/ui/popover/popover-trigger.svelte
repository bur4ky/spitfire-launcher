<script lang="ts">
  import { cn } from "$lib/utils";
  import { Popover as PopoverPrimitive } from "bits-ui";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: PopoverPrimitive.TriggerProps = $props();
</script>

<PopoverPrimitive.Trigger
  class={cn("", className)}
  data-slot="popover-trigger"
  bind:ref
  {...restProps}
/>
