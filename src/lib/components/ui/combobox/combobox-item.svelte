<script lang="ts">
  import { cn, type WithoutChild } from '$lib/utils';
  import CheckIcon from '@lucide/svelte/icons/check';
  import { Combobox as ComboboxPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    class: className,
    value,
    label,
    children: childrenProp,
    ...restProps
  }: WithoutChild<ComboboxPrimitive.ItemProps> = $props();
</script>

<ComboboxPrimitive.Item
  {...restProps}
  class={cn(
    "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 ps-2 pe-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
    className
  )}
  data-slot="combobox-item"
  {value}
  bind:ref
>
  {#snippet children({ selected, highlighted })}
    <span class="absolute end-2 flex size-3.5 items-center justify-center">
      {#if selected}
        <CheckIcon class="size-4" />
      {/if}
    </span>
    {#if childrenProp}
      {@render childrenProp({ selected, highlighted })}
    {:else}
      {label || value}
    {/if}
  {/snippet}
</ComboboxPrimitive.Item>
