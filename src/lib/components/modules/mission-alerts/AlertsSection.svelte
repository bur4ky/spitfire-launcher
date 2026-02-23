<script lang="ts">
  import MissionRow from '$components/modules/mission-alerts/MissionRow.svelte';
  import { t } from '$lib/i18n';
  import type { WorldParsedMission } from '$types/game/stw/world-info';

  type Props = {
    title: string;
    missions: WorldParsedMission[];
  };

  const { title, missions }: Props = $props();

  let visible = $state(false);
  let div = $state<HTMLDivElement>();

  $effect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          visible = true;
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(div!);
    return () => observer.disconnect();
  });
</script>

<div class="rounded-md border bg-card">
  <h3 class="border-b border-border/50 px-4 py-2.5 text-sm font-semibold text-foreground">{title}</h3>
  <div bind:this={div} class="divide-y divide-border/20">
    {#if !missions.length}
      <div class="py-4 text-center text-xs text-muted-foreground">
        {$t('stwMissionAlerts.noMissions')}
      </div>
    {:else if !visible}
      <div style="height: {missions.length * 36}px" class="bg-muted"></div>
    {:else}
      {#each missions as mission (mission.guid)}
        <MissionRow {mission} />
      {/each}
    {/if}
  </div>
</div>
