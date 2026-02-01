<script lang="ts">
  import { cn } from '$lib/utils';
  import { Dialog as DialogPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: DialogPrimitive.DescriptionProps = $props();
</script>

<DialogPrimitive.Description
  {...restProps}
  class={cn("text-muted-foreground text-sm", className)}
  data-slot="dialog-description"
  bind:ref
/>
