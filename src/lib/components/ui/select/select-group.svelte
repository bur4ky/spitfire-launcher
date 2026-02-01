<script lang="ts">
  import { Select as SelectPrimitive } from 'bits-ui';

  let { ref = $bindable(null), ...restProps }: SelectPrimitive.GroupProps = $props();
</script>

<SelectPrimitive.Group {...restProps} data-slot="select-group" bind:ref />
