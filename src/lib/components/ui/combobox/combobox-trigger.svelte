<script lang="ts">
  import { cn, type WithoutChild } from '$lib/utils';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import { Combobox as ComboboxPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    class: className,
    children,
    size = 'default',
    ...restProps
  }: WithoutChild<ComboboxPrimitive.TriggerProps> & {
    size?: 'sm' | 'default';
  } = $props();
</script>

<ComboboxPrimitive.Trigger
  {...restProps}
  class={cn(
    "flex w-fit items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=combobox-value]:line-clamp-1 *:data-[slot=combobox-value]:flex *:data-[slot=combobox-value]:items-center *:data-[slot=combobox-value]:gap-2 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
    className
  )}
  data-size={size}
  data-slot="combobox-trigger"
  bind:ref
>
  {#if children}
    {@render children()}
  {:else}
    <ChevronDownIcon class="size-4 opacity-50" />
  {/if}
</ComboboxPrimitive.Trigger>
