<script lang="ts">
  import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
  import { Select as SelectPrimitive } from "bits-ui";
  import { cn, type WithoutChildrenOrChild } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<SelectPrimitive.ScrollUpButtonProps> = $props();
</script>

<SelectPrimitive.ScrollUpButton
  class={cn("flex cursor-default items-center justify-center py-1", className)}
  data-slot="select-scroll-up-button"
  bind:ref
  {...restProps}
>
  <ChevronUpIcon class="size-4" />
</SelectPrimitive.ScrollUpButton>
