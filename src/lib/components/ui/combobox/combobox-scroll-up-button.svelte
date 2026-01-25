<script lang="ts">
  import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
  import { Combobox as ComboboxPrimitive } from "bits-ui";
  import { cn, type WithoutChildrenOrChild } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<ComboboxPrimitive.ScrollUpButtonProps> = $props();
</script>

<ComboboxPrimitive.ScrollUpButton
  class={cn("flex cursor-default items-center justify-center py-1", className)}
  data-slot="combobox-scroll-up-button"
  bind:ref
  {...restProps}
>
  <ChevronUpIcon class="size-4" />
</ComboboxPrimitive.ScrollUpButton>
