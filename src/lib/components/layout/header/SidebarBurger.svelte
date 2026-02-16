<script lang="ts">
  import { useSidebar } from '$components/ui/sidebar';
  import MenuIcon from '@lucide/svelte/icons/menu';

  const sidebar = useSidebar();
</script>

<button class="mr-auto rounded p-2 hover:bg-accent" class:hidden={!sidebar.isMobile} onclick={sidebar.toggle}>
  <MenuIcon class="size-6" />
</button>
