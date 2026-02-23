<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import AlertsOverviewItem from '$components/modules/mission-alerts/AlertsOverviewItem.svelte';
  import AlertsSection from '$components/modules/mission-alerts/AlertsSection.svelte';
  import AlertsSectionSkeleton from '$components/modules/mission-alerts/skeletons/AlertsSectionSkeleton.svelte';
  import * as Tabs from '$components/ui/tabs';
  import { MCP } from '$lib/modules/mcp';
  import type { WorldParsedMission } from '$types/game/stw/world-info';
  import { claimedMissionAlerts, worldInfoCache } from '$lib/stores';
  import { TheaterPowerLevels, Theaters, ZoneCategories } from '$lib/constants/stw/world-info';
  import { language, t } from '$lib/i18n';
  import { WorldInfo } from '$lib/modules/world-info';
  import { onMount } from 'svelte';
  import { accountStore } from '$lib/storage';
  import { SvelteSet } from 'svelte/reactivity';
  import { Button } from '$components/ui/button';
  import FunnelIcon from '@lucide/svelte/icons/funnel';
  import FilterSheet, { filters } from '$components/modules/mission-alerts/FilterSheet.svelte';
  import { theaters } from '$lib/constants/stw/resources';

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

        if (f.missionTypes.size) {
          const match = f.missionTypes.values().some((missionType) => {
            const keys = ZoneCategories[missionType as keyof typeof ZoneCategories];
            return keys?.some((key) => mission.generator.includes(key));
          });

          if (!match) continue;
        }

        const alertRewards = mission.alert?.rewards ?? [];
        const allRewards = [...alertRewards, ...mission.rewards];
        if (f.rarities.size) {
          const match = allRewards.some((reward) => {
            if (!('rarity' in reward)) return false;

            const { itemId } = reward;
            return (
              f.rarities.has(reward.rarity) &&
              (itemId.includes('currency_mtxswap') ||
                itemId.includes('Worker') ||
                itemId.includes('Hero') ||
                itemId.includes('Defender') ||
                itemId.includes('Schematic'))
            );
          });

          if (!match) continue;
        }

        if (f.rewards.size) {
          if (!matchesRewardFilter(allRewards, f.rewards)) continue;
        }

        const vbucksReward = alertRewards.find((x) => x.itemId.includes('currency_mtxswap'));
        if (vbucksReward || mission.rewards.some((x) => x.itemId.includes('currency_mtxswap'))) {
          if (vbucksReward) totalVbucks += vbucksReward.quantity;
          vbucks.push(mission);
        }

        const upgradeLlamaReward = alertRewards.find((x) => x.itemId.includes('voucher_cardpack_bronze'));
        if (upgradeLlamaReward || mission.rewards.some((x) => x.itemId.includes('voucher_cardpack_bronze'))) {
          if (upgradeLlamaReward) totalUpgradeLlamas += upgradeLlamaReward.quantity;
          upgradeLlamaTokens.push(mission);
        }

        const survivorReward = alertRewards.find((x) => isLegendaryOrMythicSurvivor(x.itemId));
        if (survivorReward || mission.rewards.some((x) => isLegendaryOrMythicSurvivor(x.itemId))) {
          if (survivorReward) totalSurvivors += survivorReward.quantity;
          survivors.push(mission);
        }

        const perkUpReward = alertRewards.find((x) => x.itemId.includes('alteration_upgrade_sr'));
        if (perkUpReward || mission.rewards.some((x) => x.itemId.includes('alteration_upgrade_sr'))) {
          if (perkUpReward) totalPerkUp += perkUpReward.quantity;
          perkUp.push(mission);
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
          if (theaterId === Theaters.Stonewood) {
            stonewood.push(mission);
          } else if (theaterId === Theaters.Plankerton) {
            plankerton.push(mission);
          } else if (theaterId === Theaters.CannyValley) {
            cannyValley.push(mission);
          } else if (theaterId === Theaters.TwinePeaks) {
            twinePeaks.push(mission);
          } else {
            ventures.push(mission);
          }
        }
      }
    }

    return {
      stonewood,
      plankerton,
      cannyValley,
      twinePeaks,
      ventures,
      vbucks,
      survivors,
      twinePeaks160,
      ventures140,
      upgradeLlamaTokens,
      perkUp,
      totalVbucks,
      totalSurvivors,
      totalUpgradeLlamas,
      totalPerkUp
    };
  });

  function isLegendaryOrMythicSurvivor(itemId: string) {
    return itemId.includes('workerbasic_sr') || (itemId.startsWith('Worker:manager') && itemId.includes('_sr_'));
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

  function matchesRewardFilter(allRewards: { itemId: string }[], rewards: Set<string>) {
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

  function refreshWorldInfo() {
    worldInfoCache.set(new Map());
    WorldInfo.setCache();
  }

  function getResetDate() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  }

  $effect(() => {
    if (!$activeAccount || claimedMissionAlerts.has($activeAccount.accountId)) return;

    MCP.queryProfile($activeAccount, 'campaign').then((queryProfile) => {
      const attributes = queryProfile.profileChanges[0].profile.stats.attributes;
      const doneMissionAlerts =
        attributes.mission_alert_redemption_record?.claimData?.map((claimData) => claimData.missionAlertId) || [];

      claimedMissionAlerts.set($activeAccount.accountId, new SvelteSet(doneMissionAlerts));
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
          title={$t('stwMissionAlerts.sections.twinePeaks')}
        />
        <AlertsSection
          missions={filteredMissions?.ventures140 || []}
          title={$t('stwMissionAlerts.sections.ventures')}
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
      <AlertsSection
        missions={filteredMissions?.stonewood || []}
        title={theaters[Theaters.Stonewood].names[$language]}
      />
      <AlertsSection
        missions={filteredMissions?.plankerton || []}
        title={theaters[Theaters.Plankerton].names[$language]}
      />
      <AlertsSection
        missions={filteredMissions?.cannyValley || []}
        title={theaters[Theaters.CannyValley].names[$language]}
      />
      <AlertsSection
        missions={filteredMissions?.twinePeaks || []}
        title={theaters[Theaters.TwinePeaks].names[$language]}
      />
      <AlertsSection missions={filteredMissions?.ventures || []} title={$t('stwMissionAlerts.sections.ventures')} />
    </Tabs.Content>
  </Tabs.Root>

  <FilterSheet bind:open={showFilters} />
</PageContent>
