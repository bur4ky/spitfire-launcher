<script lang="ts">
  import { Combobox as ComboboxPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import type { ComponentProps } from "svelte";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: ComponentProps<typeof ComboboxPrimitive.GroupHeading> = $props();
</script>

<ComboboxPrimitive.GroupHeading
  class={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
  data-slot="combobox-group-heading"
  bind:ref
  {...restProps}
>
  {@render children?.()}
</ComboboxPrimitive.GroupHeading>
