<script lang="ts">
  import { cn, type WithoutChild } from '$lib/utils';
  import { Accordion as AccordionPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithoutChild<AccordionPrimitive.ContentProps> = $props();
</script>

<AccordionPrimitive.Content
  {...restProps}
  class={cn(
    'overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
    className
  )}
  data-slot="accordion-content"
  bind:ref
>
  {@render children?.()}
</AccordionPrimitive.Content>
