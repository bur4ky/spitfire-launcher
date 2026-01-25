<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import type { ComponentProps } from "svelte";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: ComponentProps<typeof SelectPrimitive.GroupHeading> = $props();
</script>

<SelectPrimitive.GroupHeading
  class={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
  data-slot="select-group-heading"
  bind:ref
  {...restProps}
>
  {@render children?.()}
</SelectPrimitive.GroupHeading>
