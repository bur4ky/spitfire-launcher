<script lang="ts">
  import { Combobox as ComboboxPrimitive } from 'bits-ui';

  let { ref = $bindable(null), ...restProps }: ComboboxPrimitive.GroupProps = $props();
</script>

<ComboboxPrimitive.Group {...restProps} data-slot="combobox-group" bind:ref />
