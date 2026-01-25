<script lang="ts">
  import { Popover as PopoverPrimitive } from "bits-ui";

  let { ref = $bindable(null), ...restProps }: PopoverPrimitive.CloseProps = $props();
</script>

<PopoverPrimitive.Close data-slot="popover-close" bind:ref {...restProps} />
