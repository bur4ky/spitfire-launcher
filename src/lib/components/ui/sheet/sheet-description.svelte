<script lang="ts">
  import { Dialog as SheetPrimitive } from 'bits-ui';
  import { cn } from '$lib/utils.js';

  let { ref = $bindable(null), class: className, ...restProps }: SheetPrimitive.DescriptionProps = $props();
</script>

<SheetPrimitive.Description
  class={cn('text-sm text-muted-foreground', className)}
  data-slot="sheet-description"
  bind:ref
  {...restProps}
/>
