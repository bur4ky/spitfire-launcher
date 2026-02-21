<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import AlertsOverviewItem from '$components/modules/mission-alerts/AlertsOverviewItem.svelte';
  import AlertsSection from '$components/modules/mission-alerts/AlertsSection.svelte';
  import AlertsSectionSkeleton from '$components/modules/mission-alerts/skeletons/AlertsSectionSkeleton.svelte';
  import { MCP } from '$lib/modules/mcp';
  import type { WorldParsedMission } from '$types/game/stw/world-info';
  import { claimedMissionAlerts, worldInfoCache } from '$lib/stores';
  import { TheaterPowerLevels, Theaters } from '$lib/constants/stw/world-info';
  import { isLegendaryOrMythicSurvivor } from '$lib/utils';
  import { t } from '$lib/i18n';
  import { WorldInfo } from '$lib/modules/world-info';
  import { onMount } from 'svelte';
  import { accountStore } from '$lib/storage';
  import { SvelteSet } from 'svelte/reactivity';

  const activeAccount = accountStore.getActiveStore(true);

  const filteredMissions = $derived.by(() => {
    if (!$worldInfoCache?.size) return null;

    const vbucks: WorldParsedMission[] = [];
    const survivors: WorldParsedMission[] = [];
    const twinePeaks: WorldParsedMission[] = [];
    const ventures: WorldParsedMission[] = [];
    const upgradeLlamaTokens: WorldParsedMission[] = [];
    const perkUp: WorldParsedMission[] = [];

    for (const [theaterId, worldMissions] of $worldInfoCache.entries()) {
      for (const mission of worldMissions.values()) {
        let hasVbucks = false;
        let hasSurvivor = false;
        let hasUpgradeToken = false;
        let hasPerkUp = false;

        for (const id of mission.rewardIds) {
          if (!hasVbucks && id.includes('currency_mtxswap')) {
            hasVbucks = true;
            vbucks.push(mission);
          }

          if (!hasSurvivor && isLegendaryOrMythicSurvivor(id)) {
            hasSurvivor = true;
            survivors.push(mission);
          }

          if (!hasUpgradeToken && id.includes('voucher_cardpack_bronze')) {
            hasUpgradeToken = true;
            upgradeLlamaTokens.push(mission);
          }

          if (!hasPerkUp && id.includes('alteration_upgrade_sr')) {
            hasPerkUp = true;
            perkUp.push(mission);
          }
        }

        if (
          theaterId === Theaters.TwinePeaks &&
          mission.powerLevel === TheaterPowerLevels[Theaters.TwinePeaks].Endgame_Zone6
        ) {
          twinePeaks.push(mission);
        }

        if (
          theaterId !== Theaters.Stonewood &&
          theaterId !== Theaters.Plankerton &&
          theaterId !== Theaters.CannyValley &&
          theaterId !== Theaters.TwinePeaks &&
          mission.powerLevel === TheaterPowerLevels.Ventures.Phoenix_Zone25
        ) {
          ventures.push(mission);
        }
      }
    }

    return {
      vbucks,
      survivors,
      twinePeaks,
      ventures,
      upgradeLlamaTokens,
      perkUp
    };
  });

  function refreshWorldInfo() {
    worldInfoCache.set(new Map());
    WorldInfo.setCache();
  }

  function countMissionReward(
    missions: WorldParsedMission[] | undefined,
    idOrValidator: string | ((id: string) => boolean)
  ) {
    return (missions || []).reduce((acc, crr) => {
      const alertReward = crr.alert?.rewards.find((reward) =>
        typeof idOrValidator === 'function' ? idOrValidator(reward.itemId) : reward.itemId.includes(idOrValidator)
      );

      const missionReward = crr.rewards.find((reward) =>
        typeof idOrValidator === 'function' ? idOrValidator(reward.itemId) : reward.itemId.includes(idOrValidator)
      );

      acc += (alertReward?.quantity || 0) + (missionReward?.quantity || 0);

      return acc;
    }, 0);
  }

  function getResetDate() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const day = now.getUTCDate();

    return new Date(Date.UTC(year, month, day + 1));
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
    const timeout = setTimeout(() => {
      refreshWorldInfo();
    }, timeUntilReset + 5000);

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
      amount={countMissionReward(filteredMissions?.vbucks, 'currency_mtxswap')}
      icon="/resources/currency_mtxswap.png"
    />
    <AlertsOverviewItem
      name={$t('stwMissionAlerts.overview.survivors')}
      amount={countMissionReward(filteredMissions?.survivors, isLegendaryOrMythicSurvivor)}
      icon="/resources/voucher_generic_worker_sr.png"
    />
    <AlertsOverviewItem
      name={$t('stwMissionAlerts.overview.upgradeLlamas')}
      amount={countMissionReward(filteredMissions?.upgradeLlamaTokens, 'voucher_cardpack_bronze')}
      icon="/resources/voucher_cardpack_bronze.png"
    />
    <AlertsOverviewItem
      name={$t('stwMissionAlerts.overview.perkup')}
      amount={countMissionReward(filteredMissions?.perkUp, 'alteration_upgrade_sr')}
      icon="/resources/reagent_alteration_upgrade_sr.png"
    />
  </div>

  <div class="space-y-4">
    {#if $worldInfoCache?.size}
      <AlertsSection missions={filteredMissions?.vbucks || []} title={$t('vbucks')} />
      <AlertsSection missions={filteredMissions?.survivors || []} title={$t('stwMissionAlerts.sections.survivors')} />
      <AlertsSection missions={filteredMissions?.twinePeaks || []} title={$t('stwMissionAlerts.sections.twinePeaks')} />
      <AlertsSection missions={filteredMissions?.ventures || []} title={$t('stwMissionAlerts.sections.ventures')} />
      <AlertsSection
        missions={filteredMissions?.upgradeLlamaTokens || []}
        title={$t('stwMissionAlerts.sections.upgradeLlamaTokens')}
      />
      <AlertsSection missions={filteredMissions?.perkUp || []} title={$t('stwMissionAlerts.sections.perkup')} />
    {:else}
      <AlertsSectionSkeleton />
      <AlertsSectionSkeleton />
    {/if}
  </div>
</PageContent>
