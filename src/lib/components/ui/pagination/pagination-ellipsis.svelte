<script lang="ts">
  import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
  import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> = $props();
</script>

<span
  bind:this={ref}
  class={cn("flex size-9 items-center justify-center", className)}
  aria-hidden="true"
  data-slot="pagination-ellipsis"
  {...restProps}
>
  <EllipsisIcon class="size-4" />
  <span class="sr-only">More pages</span>
</span>
