<script lang="ts">
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import { cn } from '$lib/utils';

  let { ref = $bindable(null), class: className, ...restProps }: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
  {...restProps}
  class={cn(
    'relative cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
    'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
    'data-[state=active]:bg-accent data-[state=active]:text-foreground',
    'disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  data-slot="tabs-trigger"
  bind:ref
/>
