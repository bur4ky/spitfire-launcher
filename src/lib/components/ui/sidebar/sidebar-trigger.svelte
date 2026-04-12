<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
  import { cn } from '$lib/utils.js';
  import { Button } from '$components/ui/button/index.js';
  import { useSidebar } from './context.svelte.js';

  let {
    // eslint-disable-next-line no-useless-assignment
    ref = $bindable(null),
    class: className,
    onclick,
    ...restProps
  }: ComponentProps<typeof Button> & {
    onclick?: (e: MouseEvent) => void;
  } = $props();

  const sidebar = useSidebar();
</script>

<Button
  class={cn('size-7', className)}
  data-sidebar="trigger"
  data-slot="sidebar-trigger"
  onclick={(e) => {
    onclick?.(e);
    sidebar.toggle();
  }}
  size="icon"
  type="button"
  variant="ghost"
  {...restProps}
>
  <PanelLeftIcon />
  <span class="sr-only">Toggle Sidebar</span>
</Button>
