<script lang="ts">
  import { cn } from '$lib/utils';
  import { Tabs as TabsPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
  {...restProps}
  class={cn(
    "relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
    "text-muted-foreground hover:text-foreground hover:bg-accent/50",
    "data-[state=active]:bg-accent data-[state=active]:text-foreground",
    "disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  data-slot="tabs-trigger"
  bind:ref
/>
