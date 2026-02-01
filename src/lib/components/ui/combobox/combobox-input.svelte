<script lang="ts">
  import { Combobox as ComboboxPrimitive } from 'bits-ui';

  let { ...restProps }: ComboboxPrimitive.InputProps = $props();
</script>

<ComboboxPrimitive.Input {...restProps} />