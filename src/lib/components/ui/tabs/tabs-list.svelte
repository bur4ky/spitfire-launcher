<script lang="ts">
  import { Tabs as TabsPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: TabsPrimitive.ListProps = $props();
</script>

<TabsPrimitive.List
  class={cn(
    "text-muted-foreground inline-flex h-9 w-full items-center p-[3px] border-b",
    className
  )}
  data-slot="tabs-list"
  bind:ref
  {...restProps}
/>
