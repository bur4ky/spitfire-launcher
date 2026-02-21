<script lang="ts">
  import { Accordion as AccordionPrimitive } from 'bits-ui';

  let { ref = $bindable(null), ...restProps }: AccordionPrimitive.ItemProps = $props();
</script>

<AccordionPrimitive.Item {...restProps} data-slot="accordion-item" bind:ref />
