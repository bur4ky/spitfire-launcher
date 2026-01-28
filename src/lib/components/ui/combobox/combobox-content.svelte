<script lang="ts">
  import type { WithoutChildrenOrChild } from '$lib/utils';
  import { cn, type WithoutChild } from '$lib/utils';
  import { Combobox as ComboboxPrimitive } from 'bits-ui';
  import type { ComponentProps } from 'svelte';
  import ComboboxPortal from './combobox-portal.svelte';
  import ComboboxScrollDownButton from './combobox-scroll-down-button.svelte';
  import ComboboxScrollUpButton from './combobox-scroll-up-button.svelte';

  let {
    ref = $bindable(null),
    class: className,
    sideOffset = 4,
    portalProps,
    children,
    preventScroll = true,
    ...restProps
  }: WithoutChild<ComboboxPrimitive.ContentProps> & {
    portalProps?: WithoutChildrenOrChild<ComponentProps<typeof ComboboxPortal>>;
  } = $props();
</script>

<ComboboxPortal {...portalProps}>
  <ComboboxPrimitive.Content
    {...restProps}
    class={cn(
      "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-end-2 data-[side=right]:slide-in-from-start-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--bits-combobox-content-available-height) min-w-[8rem] origin-(--bits-combobox-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    )}
    data-slot="combobox-content"
    {preventScroll}
    {sideOffset}
    bind:ref
  >
    <ComboboxScrollUpButton />
    <ComboboxPrimitive.Viewport
      class={cn(
        "h-(--bits-combobox-anchor-height) w-full min-w-(--bits-combobox-anchor-width) scroll-my-1 p-1"
      )}
    >
      {@render children?.()}
    </ComboboxPrimitive.Viewport>
    <ComboboxScrollDownButton />
  </ComboboxPrimitive.Content>
</ComboboxPortal>
