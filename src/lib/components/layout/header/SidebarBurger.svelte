<script lang="ts">
  import { sidebarOpen } from '$components/layout/sidebar/Sidebar.svelte';
  import MenuIcon from '@lucide/svelte/icons/menu';

  function toggleSidebar() {
    sidebarOpen.update((value) => !value);
  }
</script>

<button
  class="p-2 rounded hover:bg-accent transition-colors duration-200 lg:hidden mr-auto"
  onclick={toggleSidebar}
>
  <MenuIcon class="size-6" />
</button>