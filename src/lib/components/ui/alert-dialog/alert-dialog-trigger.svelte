<script lang="ts">
  import { AlertDialog as AlertDialogPrimitive } from "bits-ui";

  let { ref = $bindable(null), ...restProps }: AlertDialogPrimitive.TriggerProps = $props();
</script>

<AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" bind:ref {...restProps} />
