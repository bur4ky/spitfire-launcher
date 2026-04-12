<script lang="ts">
  import MenuIcon from '@lucide/svelte/icons/menu';
  import { useSidebar } from '$components/ui/sidebar';

  const sidebar = useSidebar();
</script>

<button class="mr-auto rounded p-2 hover:bg-accent" class:hidden={!sidebar.isMobile} onclick={sidebar.toggle}>
  <MenuIcon class="size-6" />
</button>
