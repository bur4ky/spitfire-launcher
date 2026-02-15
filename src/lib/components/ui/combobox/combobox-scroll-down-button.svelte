<script lang="ts">
  import { cn, type WithoutChildrenOrChild } from '$lib/utils';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import { Combobox as ComboboxPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<ComboboxPrimitive.ScrollDownButtonProps> = $props();
</script>

<ComboboxPrimitive.ScrollDownButton
  {...restProps}
  class={cn('flex cursor-default items-center justify-center py-1', className)}
  data-slot="combobox-scroll-down-button"
  bind:ref
>
  <ChevronDownIcon class="size-4" />
</ComboboxPrimitive.ScrollDownButton>
