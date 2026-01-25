<script lang="ts">
  import { Pagination as PaginationPrimitive } from "bits-ui";

  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    count = 0,
    perPage = 10,
    page = $bindable(1),
    siblingCount = 1,
    ...restProps
  }: PaginationPrimitive.RootProps = $props();
</script>

<PaginationPrimitive.Root
  class={cn("mx-auto flex w-full justify-center", className)}
  aria-label="pagination"
  {count}
  data-slot="pagination"
  {perPage}
  role="navigation"
  {siblingCount}
  bind:ref
  bind:page
  {...restProps}
/>
