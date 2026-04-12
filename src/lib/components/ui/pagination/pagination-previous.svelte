<script lang="ts">
  import { Pagination as PaginationPrimitive } from 'bits-ui';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import { cn } from '$lib/utils';
  import { buttonVariants } from '$components/ui/button/index.js';

  let { ref = $bindable(null), class: className, ...restProps }: PaginationPrimitive.PrevButtonProps = $props();
</script>

<PaginationPrimitive.PrevButton
  {...restProps}
  class={cn(
    buttonVariants({
      size: 'default',
      variant: 'ghost',
      class: 'gap-1 px-2.5 sm:ps-2.5'
    }),
    className
  )}
  aria-label="Go to previous page"
  bind:ref
>
  <ChevronLeftIcon />
  <span class="hidden sm:block">Previous</span>
</PaginationPrimitive.PrevButton>
