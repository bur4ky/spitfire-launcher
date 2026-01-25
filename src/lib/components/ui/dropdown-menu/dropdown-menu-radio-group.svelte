<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

  let {
    ref = $bindable(null),
    value = $bindable(),
    ...restProps
  }: DropdownMenuPrimitive.RadioGroupProps = $props();
</script>

<DropdownMenuPrimitive.RadioGroup
  data-slot="dropdown-menu-radio-group"
  bind:ref
  bind:value
  {...restProps}
/>
