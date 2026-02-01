<script lang="ts">
  import { cn } from '$lib/utils';
  import { Tabs as TabsPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: TabsPrimitive.ListProps = $props();
</script>

<TabsPrimitive.List
  {...restProps}
  class={cn(
    "text-muted-foreground inline-flex h-9 w-full items-center p-[3px] border-b",
    className
  )}
  data-slot="tabs-list"
  bind:ref
/>
