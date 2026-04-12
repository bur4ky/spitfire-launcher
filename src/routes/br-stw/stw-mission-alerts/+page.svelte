<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import FunnelIcon from '@lucide/svelte/icons/funnel';
  import { TheaterNames, TheaterPowerLevels, Theaters, ZoneCategories } from '$lib/constants/stw/world-info';
  import { t } from '$lib/i18n';
  import { MCP } from '$lib/modules/mcp';
  import { WorldInfo } from '$lib/modules/world-info';
  import { accountStore } from '$lib/storage';
  import { claimedAlerts, worldInfoCache } from '$lib/stores';
  import PageContent from '$components/layout/PageContent.svelte';
  import AlertsOverviewItem from '$components/modules/mission-alerts/AlertsOverviewItem.svelte';
  import AlertsSection from '$components/modules/mission-alerts/AlertsSection.svelte';
  import FilterSheet, { filters } from '$components/modules/mission-alerts/FilterSheet.svelte';
  import AlertsSectionSkeleton from '$components/modules/mission-alerts/skeletons/AlertsSectionSkeleton.svelte';
  import { Button } from '$components/ui/button';
  import * as Tabs from '$components/ui/tabs';
  import type { RarityType } from '$types/game/stw/resources';
  import type { WorldParsedMission } from '$types/game/stw/world-info';

  const activeAccount = accountStore.getActiveStore(true);

  let showFilters = $state(false);

  const filteredMissions = $derived.by(() => {
    if (!$worldInfoCache?.size) return null;

    const stonewood: WorldParsedMission[] = [];
    const plankerton: WorldParsedMission[] = [];
    const cannyValley: WorldParsedMission[] = [];
    const twinePeaks: WorldParsedMission[] = [];
    const ventures: WorldParsedMission[] = [];

    const vbucks: WorldParsedMission[] = [];
    const survivors: WorldParsedMission[] = [];
    const twinePeaks160: WorldParsedMission[] = [];
    const ventures140: WorldParsedMission[] = [];
    const upgradeLlamaTokens: WorldParsedMission[] = [];
    const perkUp: WorldParsedMission[] = [];

    let totalVbucks = 0;
    let totalSurvivors = 0;
    let totalUpgradeLlamas = 0;
    let totalPerkUp = 0;

    const f = $filters;

    for (const [theaterId, worldMissions] of $worldInfoCache.entries()) {
      if (!matchesZoneFilter(theaterId, f.zones)) continue;

      for (const mission of worldMissions.values()) {
        if (f.group && !mission.isGroup) continue;
        if (!matchesMissionTypeFilter(mission.generator, f.missionTypes)) continue;

        const alertRewards = mission.alert?.rewards ?? [];
        const allRewards = [...alertRewards, ...mission.rewards];

        if (!matchesRarityFilter(allRewards, f.rarities)) continue;
        if (!matchesRewardFilter(allRewards, f.rewards)) continue;

        const collectById = (id: string, list: WorldParsedMission[], add: (q: number) => void) => {
          const alertMatch = alertRewards.find((x) => x.itemId.includes(id));
          if (alertMatch || mission.rewards.some((x) => x.itemId.includes(id))) {
            if (alertMatch) add(alertMatch.quantity);
            list.push(mission);
          }
        };

        collectById('currency_mtxswap', vbucks, (q) => (totalVbucks += q));
        collectById('voucher_cardpack_bronze', upgradeLlamaTokens, (q) => (totalUpgradeLlamas += q));
        collectById('alteration_upgrade_sr', perkUp, (q) => (totalPerkUp += q));

        const alertSurvivorMatches = alertRewards.filter((x) => isLegendaryOrMythicSurvivor(x.itemId, x.rarity));
        if (alertSurvivorMatches.length) {
          totalSurvivors += alertSurvivorMatches.reduce((sum, x) => sum + x.quantity, 0);
          survivors.push(mission);
        }

        if (
          theaterId === Theaters.TwinePeaks &&
          mission.powerLevel === TheaterPowerLevels[Theaters.TwinePeaks].Endgame_Zone6
        ) {
          twinePeaks160.push(mission);
        }

        if (isVentureTheater(theaterId) && mission.powerLevel === TheaterPowerLevels.Ventures.Phoenix_Zone25) {
          ventures140.push(mission);
        }

        if (mission.alert) {
          if (theaterId === Theaters.Stonewood) stonewood.push(mission);
          else if (theaterId === Theaters.Plankerton) plankerton.push(mission);
          else if (theaterId === Theaters.CannyValley) cannyValley.push(mission);
          else if (theaterId === Theaters.TwinePeaks) twinePeaks.push(mission);
          else ventures.push(mission);
        }
      }
    }

    return {
      stonewood: sortMissions(stonewood),
      plankerton: sortMissions(plankerton),
      cannyValley: sortMissions(cannyValley),
      twinePeaks: sortMissions(twinePeaks),
      ventures: sortMissions(ventures),
      vbucks: sortMissions(vbucks),
      survivors: sortMissions(survivors),
      twinePeaks160,
      ventures140,
      upgradeLlamaTokens: sortMissions(upgradeLlamaTokens),
      perkUp: sortMissions(perkUp),
      totalVbucks,
      totalSurvivors,
      totalUpgradeLlamas,
      totalPerkUp
    };
  });

  function sortMissions(arr: WorldParsedMission[]) {
    const order: Record<string, number> = {
      [Theaters.Stonewood]: 4,
      [Theaters.Plankerton]: 3,
      [Theaters.CannyValley]: 2,
      [Theaters.TwinePeaks]: 1,
      Ventures: 0
    };

    return arr.sort((a, b) => {
      const theaterA = order[a.theaterId] || order.Ventures;
      const theaterB = order[b.theaterId] || order.Ventures;
      return theaterA !== theaterB ? theaterA - theaterB : b.powerLevel - a.powerLevel;
    });
  }

  function isLegendaryOrMythicSurvivor(itemId: string, rarity?: string) {
    const isWorker = itemId.includes('workerbasic') || itemId.startsWith('Worker:manager');
    return isWorker && (rarity === 'sr' || rarity === 'ur');
  }

  function isVentureTheater(theaterId: string) {
    return (
      theaterId !== Theaters.Stonewood &&
      theaterId !== Theaters.Plankerton &&
      theaterId !== Theaters.CannyValley &&
      theaterId !== Theaters.TwinePeaks
    );
  }

  function matchesZoneFilter(theaterId: string, zones: Set<string>) {
    if (!zones.size) return true;

    const isVenture = isVentureTheater(theaterId);
    return zones.has('ventures') ? isVenture || zones.has(theaterId) : zones.has(theaterId);
  }

  function matchesMissionTypeFilter(generator: string, missionTypes: Set<string>) {
    if (!missionTypes.size) return true;

    return missionTypes.values().some((missionType) => {
      const keys = ZoneCategories[missionType as keyof typeof ZoneCategories];
      return keys?.some((key) => generator.includes(key));
    });
  }

  function matchesRewardFilter(allRewards: { itemId: string }[], rewards: Set<string>) {
    if (!rewards.size) return true;

    return rewards.values().some((key) => {
      const isManager = key === 'Manager';
      const isCommand = key === 'Defender' || key === 'Hero' || key === 'Worker' || key === 'Manager';
      const isArsenal = key === 'Melee' || key === 'Ranged' || key === 'Trap';

      return allRewards.some(({ itemId }) => {
        if (isManager) return itemId.startsWith('Worker:manager');
        if (isCommand) return itemId.startsWith(key);
        if (isArsenal) return itemId.includes(key);

        return itemId.toLowerCase().includes(key.toLowerCase());
      });
    });
  }

  function matchesRarityFilter(allRewards: { itemId: string; rarity?: RarityType }[], rarities: Set<string>) {
    if (!rarities.size) return true;

    const keys = ['currency_mtxswap', 'Worker', 'Hero', 'Defender', 'Schematic'];
    return allRewards.some((reward) => {
      if (!reward.rarity) return false;

      const { itemId, rarity } = reward;
      return rarities.has(rarity) && keys.some((key) => itemId.includes(key));
    });
  }

  function refreshWorldInfo() {
    worldInfoCache.set(new Map());
    WorldInfo.setCache();
  }

  function getResetDate() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  }

  $effect(() => {
    if (!$activeAccount || claimedAlerts.has($activeAccount.accountId)) return;

    MCP.queryProfile($activeAccount, 'campaign').then((queryProfile) => {
      const attributes = queryProfile.profileChanges[0].profile.stats.attributes;
      const doneMissionAlerts =
        attributes.mission_alert_redemption_record?.claimData?.map((claimData) => claimData.missionAlertId) || [];

      claimedAlerts.set($activeAccount.accountId, new SvelteSet(doneMissionAlerts));
    });
  });

  onMount(() => {
    const timeUntilReset = getResetDate().getTime() - Date.now();
    const timeout = setTimeout(refreshWorldInfo, timeUntilReset + 5000);
    return () => clearTimeout(timeout);
  });
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'F5') {
      event.preventDefault();
      refreshWorldInfo();
    }
  }}
/>

<PageContent title={$t('stwMissionAlerts.page.title')}>
  <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <AlertsOverviewItem
      name={$t('vbucks')}
      amount={filteredMissions?.totalVbucks ?? 0}
      icon="/resources/currency_mtxswap.png"
    />
    <AlertsOverviewItem
      name={$t('stwMissionAlerts.overview.survivors')}
      amount={filteredMissions?.totalSurvivors ?? 0}
      icon="/resources/voucher_generic_worker_sr.png"
    />
    <AlertsOverviewItem
      name={$t('stwMissionAlerts.overview.upgradeLlamas')}
      amount={filteredMissions?.totalUpgradeLlamas ?? 0}
      icon="/resources/voucher_cardpack_bronze.png"
    />
    <AlertsOverviewItem
      name={$t('stwMissionAlerts.overview.perkup')}
      amount={filteredMissions?.totalPerkUp ?? 0}
      icon="/resources/reagent_alteration_upgrade_sr.png"
    />
  </div>

  <Tabs.Root value="overview">
    <Tabs.List>
      <Tabs.Trigger value="overview">{$t('stwMissionAlerts.tabs.overview')}</Tabs.Trigger>
      <Tabs.Trigger disabled={!$worldInfoCache?.size} value="all">
        {$t('stwMissionAlerts.tabs.all')}
      </Tabs.Trigger>

      <Button class="ml-auto" onclick={() => (showFilters = true)} size="sm" variant="secondary">
        <FunnelIcon />
        {$t('stwMissionAlerts.filters.title')}
      </Button>
    </Tabs.List>

    <Tabs.Content class="space-y-4" value="overview">
      {#if $worldInfoCache?.size}
        <AlertsSection missions={filteredMissions?.vbucks || []} title={$t('vbucks')} />
        <AlertsSection missions={filteredMissions?.survivors || []} title={$t('stwMissionAlerts.sections.survivors')} />
        <AlertsSection
          missions={filteredMissions?.twinePeaks160 || []}
          title="{$t('stwMissionAlerts.sections.twinePeaks')} ⚡160"
        />
        <AlertsSection
          missions={filteredMissions?.ventures140 || []}
          title="{$t('stwMissionAlerts.sections.ventures')} ⚡140"
        />
        <AlertsSection
          missions={filteredMissions?.upgradeLlamaTokens || []}
          title={$t('stwMissionAlerts.sections.upgradeLlamaTokens')}
        />
        <AlertsSection missions={filteredMissions?.perkUp || []} title={$t('stwMissionAlerts.sections.perkup')} />
      {:else}
        <AlertsSectionSkeleton />
        <AlertsSectionSkeleton />
      {/if}
    </Tabs.Content>

    <Tabs.Content class="space-y-4" value="all">
      <AlertsSection missions={filteredMissions?.stonewood || []} title={$TheaterNames[Theaters.Stonewood]} />
      <AlertsSection missions={filteredMissions?.plankerton || []} title={$TheaterNames[Theaters.Plankerton]} />
      <AlertsSection missions={filteredMissions?.cannyValley || []} title={$TheaterNames[Theaters.CannyValley]} />
      <AlertsSection missions={filteredMissions?.twinePeaks || []} title={$TheaterNames[Theaters.TwinePeaks]} />
      <AlertsSection missions={filteredMissions?.ventures || []} title={$t('stwMissionAlerts.sections.ventures')} />
    </Tabs.Content>
  </Tabs.Root>

  <FilterSheet bind:open={showFilters} />
</PageContent>
