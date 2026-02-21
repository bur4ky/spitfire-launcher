<script lang="ts">
  import { TheaterNames, Theaters, TheaterColors, ZoneNames } from '$lib/constants/stw/world-info';
  import { language } from '$lib/i18n';
  import { accountStore } from '$lib/storage';
  import { claimedMissionAlerts } from '$lib/stores';
  import type { WorldParsedMission } from '$types/game/stw/world-info';

  const activeAccount = accountStore.getActiveStore(true);

  type Props = {
    mission: WorldParsedMission;
  };

  type Reward = WorldParsedMission['rewards'][number] | NonNullable<WorldParsedMission['alert']>['rewards'][number];
  type Indexable = Record<string, string>;

  const { mission }: Props = $props();

  const zoneName = $derived(($ZoneNames as Indexable)[mission.zone.type.id!]);
  const theaterName = $derived(($TheaterNames as Indexable)[mission.theaterId]);
  const theaterColor = $derived((TheaterColors as Indexable)[mission.theaterId] || TheaterColors.Ventures);
  const theaterLetter = $derived.by(() => {
    switch (mission.theaterId) {
      case Theaters.Stonewood:
        return 'S';
      case Theaters.Plankerton:
        return 'P';
      case Theaters.CannyValley:
        return 'C';
      case Theaters.TwinePeaks:
        return 'T';
      default:
        return 'V';
    }
  });
</script>

<!-- Desktop -->
<div class="hidden items-center gap-2 px-3 py-1.5 transition hover:bg-accent/50 sm:flex">
  <div
    style="border-color: {theaterColor}; color: {theaterColor}"
    class="flex size-5 items-center justify-center rounded border text-sm"
    title={theaterName}
  >
    {theaterLetter}
  </div>
  <img class="size-5" alt={zoneName} src={mission.zone.type.imageUrl} />

  <span class="w-10 text-xs font-semibold text-muted-foreground">
    ⚡{mission.powerLevel}
  </span>

  <span
    class="w-36 truncate text-xs font-medium text-foreground"
    class:text-green-500={claimedMissionAlerts.get($activeAccount?.accountId || '')?.has(mission.guid)}
  >
    {zoneName}
  </span>

  <div class="flex w-64 flex-wrap items-center gap-x-1.5 gap-y-0.5 overflow-x-auto">
    {@render InlineRewards(mission.alert?.rewards || [], true)}
  </div>

  <div class="flex flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5 overflow-x-auto">
    {@render InlineRewards(mission.rewards)}
  </div>

  <div class="flex items-center gap-0.5">
    {#each mission.modifiers as modifier (modifier.id)}
      <img class="size-5" alt="Modifier icon" src={modifier.imageUrl} />
    {/each}
  </div>
</div>

<!-- Mobile -->
<div class="flex flex-col gap-1 px-3 py-2 transition hover:bg-accent/50 sm:hidden">
  <div class="flex items-center gap-2">
    <img class="size-6" alt={zoneName} src={mission.zone.type.imageUrl} />

    <span class="text-xs font-semibold text-muted-foreground">
      ⚡{mission.powerLevel}
    </span>

    <span
      class="truncate text-xs font-medium text-foreground"
      class:text-green-500={claimedMissionAlerts.get($activeAccount?.accountId || '')?.has(mission.guid)}
    >
      {zoneName}
    </span>

    <span style="color: {theaterColor}" class="ml-auto text-xs font-medium">
      {theaterName}
    </span>
  </div>

  <div class="pl-8">
    <div class="flex items-center gap-1.5">
      {#if mission.alert?.rewards?.length}
        {@render InlineRewards(mission.alert!.rewards, true)}
      {:else}
        {@render InlineRewards(mission.rewards)}
      {/if}

      {#if mission.modifiers?.length}
        <span class="ml-auto text-xs text-muted-foreground/30"></span>

        <div class="ml-auto flex items-center gap-0.5">
          {#each mission.modifiers as modifier (modifier.id)}
            <img class="size-5" alt="Modifier icon" src={modifier.imageUrl} />
          {/each}
        </div>
      {/if}
    </div>

    {#if mission.alert?.rewards?.length}
      <div class="flex items-center gap-1.5">
        {@render InlineRewards(mission.rewards)}
      </div>
    {/if}
  </div>
</div>

{#snippet InlineRewards(rewards: Reward[], alert = false)}
  {#each rewards as reward (reward.itemId)}
    <span class="flex items-center gap-0.75">
      <img class="size-5" alt="Reward icon" src={reward.imageUrl} />
      {#if reward.quantity > 1}
        <span class="text-xs text-muted-foreground">
          {reward.quantity.toLocaleString($language)}{!alert ? 'x' : ''}
        </span>
      {/if}
    </span>
  {/each}
{/snippet}
