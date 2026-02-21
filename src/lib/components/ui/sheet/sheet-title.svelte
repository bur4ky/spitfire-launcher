<script lang="ts">
  import { Dialog as SheetPrimitive } from 'bits-ui';
  import { cn } from '$lib/utils.js';

  let { ref = $bindable(null), class: className, ...restProps }: SheetPrimitive.TitleProps = $props();
</script>

<SheetPrimitive.Title
  class={cn('font-semibold text-foreground', className)}
  data-slot="sheet-title"
  bind:ref
  {...restProps}
/>
