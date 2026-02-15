<script lang="ts">
  import { cn, type WithoutChildrenOrChild } from '$lib/utils';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import { Select as SelectPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<SelectPrimitive.ScrollUpButtonProps> = $props();
</script>

<SelectPrimitive.ScrollUpButton
  {...restProps}
  class={cn('flex cursor-default items-center justify-center py-1', className)}
  data-slot="select-scroll-up-button"
  bind:ref
>
  <ChevronUpIcon class="size-4" />
</SelectPrimitive.ScrollUpButton>
