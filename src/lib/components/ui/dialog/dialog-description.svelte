<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import { cn } from '$lib/utils';

  let { ref = $bindable(null), class: className, ...restProps }: DialogPrimitive.DescriptionProps = $props();
</script>

<DialogPrimitive.Description
  {...restProps}
  class={cn('text-sm text-muted-foreground', className)}
  data-slot="dialog-description"
  bind:ref
/>
