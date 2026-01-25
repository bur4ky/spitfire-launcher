<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import type { ComponentProps } from "svelte";

  let {
    ref = $bindable(null),
    class: className,
    inset,
    ...restProps
  }: ComponentProps<typeof DropdownMenuPrimitive.GroupHeading> & {
    inset?: boolean;
  } = $props();
</script>

<DropdownMenuPrimitive.GroupHeading
  class={cn("px-2 py-1.5 text-sm font-semibold data-[inset]:ps-8", className)}
  data-inset={inset}
  data-slot="dropdown-menu-group-heading"
  bind:ref
  {...restProps}
/>
