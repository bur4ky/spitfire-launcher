<script lang="ts">
  import { sidebarOpen } from '$components/layout/sidebar/Sidebar.svelte';
  import MenuIcon from '@lucide/svelte/icons/menu';

  function toggleSidebar() {
    sidebarOpen.update((value) => !value);
  }
</script>

<button class="mr-auto rounded p-2 transition-colors duration-200 hover:bg-accent lg:hidden" onclick={toggleSidebar}>
  <MenuIcon class="size-6" />
</button>
