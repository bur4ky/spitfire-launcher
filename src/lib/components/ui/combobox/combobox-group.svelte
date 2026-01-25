<script lang="ts">
  import { Combobox as ComboboxPrimitive } from "bits-ui";

  let { ref = $bindable(null), ...restProps }: ComboboxPrimitive.GroupProps = $props();
</script>

<ComboboxPrimitive.Group data-slot="combobox-group" bind:ref {...restProps}/>
