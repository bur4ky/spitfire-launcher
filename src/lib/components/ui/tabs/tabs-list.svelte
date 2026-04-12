<script lang="ts">
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import { cn } from '$lib/utils';

  let { ref = $bindable(null), class: className, ...restProps }: TabsPrimitive.ListProps = $props();
</script>

<TabsPrimitive.List
  {...restProps}
  class={cn('inline-flex h-9 w-full items-center space-x-1 p-0.75 text-muted-foreground', className)}
  data-slot="tabs-list"
  bind:ref
/>
