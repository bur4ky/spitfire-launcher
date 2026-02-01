<script lang="ts">
  import { cn } from '$lib/utils';
  import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: DropdownMenuPrimitive.SeparatorProps = $props();
</script>

<DropdownMenuPrimitive.Separator
  {...restProps}
  class={cn("bg-border -mx-1 my-1 h-px", className)}
  data-slot="dropdown-menu-separator"
  bind:ref
/>
