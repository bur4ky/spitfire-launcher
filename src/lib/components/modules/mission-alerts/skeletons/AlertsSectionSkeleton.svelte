<script lang="ts">
  import MissionRowSkeleton from '$components/modules/mission-alerts/skeletons/MissionRowSkeleton.svelte';

  type Props = {
    rows?: number;
  };

  const { rows = 5 }: Props = $props();
</script>

<div class="rounded-md border bg-card">
  <div class="border-b border-border/50 px-4 py-2.5">
    <div class="skeleton-loader h-4 w-40 rounded"></div>
  </div>

  <div class="divide-y divide-border/20">
    <MissionRowSkeleton count={rows} />
  </div>
</div>
