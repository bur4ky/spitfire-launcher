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
    "inline-flex items-center justify-center px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 border-transparent text-muted-foreground hover:text-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  data-slot="tabs-trigger"
  bind:ref
/>
