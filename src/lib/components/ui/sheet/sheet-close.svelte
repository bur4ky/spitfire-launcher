<script lang="ts">
  import { Dialog as SheetPrimitive } from 'bits-ui';

  let { ref = $bindable(null), ...restProps }: SheetPrimitive.CloseProps = $props();
</script>

<SheetPrimitive.Close data-slot="sheet-close" bind:ref {...restProps} />
