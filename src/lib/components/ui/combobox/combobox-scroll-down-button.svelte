<script lang="ts">
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import { Combobox as ComboboxPrimitive } from "bits-ui";
  import { cn, type WithoutChildrenOrChild } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<ComboboxPrimitive.ScrollDownButtonProps> = $props();
</script>

<ComboboxPrimitive.ScrollDownButton
  class={cn("flex cursor-default items-center justify-center py-1", className)}
  data-slot="combobox-scroll-down-button"
  bind:ref
  {...restProps}
>
  <ChevronDownIcon class="size-4" />
</ComboboxPrimitive.ScrollDownButton>
