<script lang="ts">
  import { buttonVariants } from '$components/ui/button/index.js';
  import { cn } from '$lib/utils';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { Pagination as PaginationPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: PaginationPrimitive.NextButtonProps = $props();
</script>

<PaginationPrimitive.NextButton
  {...restProps}
  class={cn(
    buttonVariants({
      size: "default",
      variant: "ghost",
      class: "gap-1 px-2.5 sm:pe-2.5",
    }),
    className
  )}
  aria-label="Go to next page"
  bind:ref
>
  <span class="hidden sm:block">Next</span>
  <ChevronRightIcon />
</PaginationPrimitive.NextButton>
