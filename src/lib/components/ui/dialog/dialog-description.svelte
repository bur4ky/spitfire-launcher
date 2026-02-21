<script lang="ts">
  import { cn } from '$lib/utils';
  import { Dialog as DialogPrimitive } from 'bits-ui';

  let { ref = $bindable(null), class: className, ...restProps }: DialogPrimitive.DescriptionProps = $props();
</script>

<DialogPrimitive.Description
  {...restProps}
  class={cn('text-sm text-muted-foreground', className)}
  data-slot="dialog-description"
  bind:ref
/>
