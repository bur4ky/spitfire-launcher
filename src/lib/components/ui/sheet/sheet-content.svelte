<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  export const sheetVariants = tv({
    base: 'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
    variants: {
      side: {
        top: 'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b px-safe',
        bottom:
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t px-safe',
        left: 'data-[state=closed]:slide-out-to-start data-[state=open]:slide-in-from-start inset-y-0 start-0 h-full w-3/4 border-e sm:max-w-sm py-safe',
        right:
          'data-[state=closed]:slide-out-to-end data-[state=open]:slide-in-from-end inset-y-0 end-0 h-full w-3/4 border-s sm:max-w-sm py-safe'
      }
    },
    defaultVariants: {
      side: 'right'
    }
  });

  export type Side = VariantProps<typeof sheetVariants>['side'];
</script>

<script lang="ts">
  import type { ComponentProps, Snippet } from 'svelte';
  import { Dialog as SheetPrimitive } from 'bits-ui';
  import XIcon from '@lucide/svelte/icons/x';
  import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
  import SheetOverlay from './sheet-overlay.svelte';
  import SheetPortal from './sheet-portal.svelte';

  let {
    ref = $bindable(null),
    class: className,
    side = 'right',
    portalProps,
    children,
    ...restProps
  }: WithoutChildrenOrChild<SheetPrimitive.ContentProps> & {
    portalProps?: WithoutChildrenOrChild<ComponentProps<typeof SheetPortal>>;
    side?: Side;
    children: Snippet;
  } = $props();
</script>

<SheetPortal {...portalProps}>
  <SheetOverlay />
  <SheetPrimitive.Content
    class={cn(sheetVariants({ side }), className)}
    data-slot="sheet-content"
    bind:ref
    {...restProps}
  >
    {@render children?.()}
    <SheetPrimitive.Close
      class={[
        'absolute end-4 top-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none',
        side === 'top' && 'px-safe',
        side === 'bottom' && 'px-safe',
        side === 'left' && 'py-safe',
        side === 'right' && 'py-safe'
      ]}
    >
      <XIcon class="size-4" />
      <span class="sr-only">Close</span>
    </SheetPrimitive.Close>
  </SheetPrimitive.Content>
</SheetPortal>
