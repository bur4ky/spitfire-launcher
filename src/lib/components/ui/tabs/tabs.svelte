<script lang="ts">
  import { cn } from '$lib/utils';
  import { Tabs as TabsPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    value = $bindable(''),
    class: className,
    ...restProps
  }: TabsPrimitive.RootProps = $props();
</script>

<TabsPrimitive.Root
  {...restProps}
  class={cn("flex flex-col gap-2", className)}
  data-slot="tabs"
  bind:ref
  bind:value
/>
