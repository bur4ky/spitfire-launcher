<script lang="ts">
  import { Dialog as DialogPrimitive } from "bits-ui";

  let { ref = $bindable(null), ...restProps }: DialogPrimitive.TriggerProps = $props();
</script>

<DialogPrimitive.Trigger data-slot="dialog-trigger" bind:ref {...restProps} />
