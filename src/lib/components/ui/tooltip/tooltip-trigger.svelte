<script lang="ts">
  import { Tooltip as TooltipPrimitive } from "bits-ui";

  let { ref = $bindable(null), ...restProps }: TooltipPrimitive.TriggerProps = $props();
</script>

<TooltipPrimitive.Trigger data-slot="tooltip-trigger" bind:ref {...restProps} />
