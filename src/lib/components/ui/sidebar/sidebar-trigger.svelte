<script lang="ts">
  import { Button } from '$components/ui/button/index.js';
  import { cn } from '$lib/utils.js';
  import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
  import type { ComponentProps } from 'svelte';
  import { useSidebar } from './context.svelte.js';

  let {
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
