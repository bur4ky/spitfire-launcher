<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
  import { cn } from '$lib/utils';

  let { ref = $bindable(null), class: className, ...restProps }: DropdownMenuPrimitive.SeparatorProps = $props();
</script>

<DropdownMenuPrimitive.Separator
  {...restProps}
  class={cn('-mx-1 my-1 h-px bg-border', className)}
  data-slot="dropdown-menu-separator"
  bind:ref
/>
