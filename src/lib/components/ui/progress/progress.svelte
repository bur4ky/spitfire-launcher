<script lang="ts">
  import { cn, type WithoutChildrenOrChild } from '$lib/utils';
  import { Progress as ProgressPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    class: className,
    max = 100,
    value,
    ...restProps
  }: WithoutChildrenOrChild<ProgressPrimitive.RootProps> = $props();
</script>

<ProgressPrimitive.Root
  {...restProps}
  class={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', className)}
  data-slot="progress"
  {max}
  {value}
  bind:ref
>
  <div
    style="transform: translateX(-{100 - (100 * (value || 0)) / (max || 1)}%)"
    class="h-full w-full flex-1 bg-primary transition-all"
    data-slot="progress-indicator"
  ></div>
</ProgressPrimitive.Root>
