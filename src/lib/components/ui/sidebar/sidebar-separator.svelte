<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils.js';
  import { Separator } from '$components/ui/separator/index.js';

  let { ref = $bindable(null), class: className, ...restProps }: ComponentProps<typeof Separator> = $props();
</script>

<Separator
  class={cn('bg-sidebar-border', className)}
  data-sidebar="separator"
  data-slot="sidebar-separator"
  bind:ref
  {...restProps}
/>
