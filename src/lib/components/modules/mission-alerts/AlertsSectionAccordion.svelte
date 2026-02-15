<script lang="ts">
  import * as Accordion from '$components/ui/accordion';
  import { language, t } from '$lib/i18n';
  import { cn, isLegendaryOrMythicSurvivor } from '$lib/utils';
  import type { WorldParsedMission } from '$types/game/stw/world-info';

  type Props = {
    missions: WorldParsedMission[];
    claimedMissionAlerts?: Set<string>;
    showAlertClaimedBorder?: boolean;
  };

  const { missions, claimedMissionAlerts = new Set(), showAlertClaimedBorder = true }: Props = $props();

  const parsedMissions = $derived.by(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const seen = new Set<string>();
    const result: any[] = [];

    for (const mission of missions) {
      if (seen.has(mission.guid)) continue;
      seen.add(mission.guid);

      const rewards = mission.alert?.rewards || mission.rewards;
      const vbucksReward = rewards.find(({ itemId }) => itemId.includes('currency_mtxswap'));
      const survivorsReward = rewards.find(({ itemId }) => isLegendaryOrMythicSurvivor(itemId));
      const upgradeLlamaTokens = rewards.find(({ itemId }) => itemId.includes('voucher_cardpack_bronze'));
      const perkupReward = getPerkupReward(mission);
      const allRewards = [vbucksReward, survivorsReward, upgradeLlamaTokens, perkupReward].filter((x) => !!x);
      const missionModifiers = mission.modifiers?.slice(0, 5) || [];

      result.push({
        ...mission,
        missionModifiers,
        allRewards
      });
    }

    return result;
  });

  function getPerkupReward(mission: WorldParsedMission) {
    const normalReward = mission.rewards.find(({ itemId }) => itemId.includes('alteration_upgrade_sr'));
    const alertReward = mission.alert?.rewards.find(({ itemId }) => itemId.includes('alteration_upgrade_sr'));

    return normalReward ? { ...normalReward, isMultiplier: true } : alertReward;
  }
</script>

<Accordion.Root class="grid gap-1 sm:grid-cols-2" type="multiple">
  {#each parsedMissions as mission (mission.guid)}
    <Accordion.Item value={mission.guid}>
      <Accordion.Trigger
        class={cn(
          'flex h-10 items-center justify-between rounded-sm bg-card px-2',
          mission.alert &&
            claimedMissionAlerts.has(mission.alert.guid) &&
            showAlertClaimedBorder &&
            'border border-green-500'
        )}
      >
        <span class="flex items-center gap-1 py-0.5">
          {#if mission.zone.iconUrl}
            <img class="size-5" alt="World icon" src={mission.zone.iconUrl} />
          {:else}
            <span
              style="border-color: {mission.zone.color}; color: {mission.zone.color};"
              class="relative flex size-5 shrink-0 items-center justify-center rounded border text-xs font-bold uppercase"
            >
              {mission.zone.letter}
            </span>
          {/if}

          <img class="size-6" alt="Zone icon" src={mission.zone.type.imageUrl} />
          <span class="shrink-0 rounded border py-1 pr-2 pl-0.5 text-xs">⚡{mission.powerLevel}</span>

          <span class="flex gap-x-2">
            {#if mission.allRewards.length}
              {#each mission.allRewards as reward, i (reward.itemId)}
                <div class="flex gap-1">
                  <img class="size-6" alt="Reward icon" src={reward.imageUrl} />

                  {#if reward.quantity > 1}
                    <span class="font-bold">
                      {reward.quantity.toLocaleString($language)}{'isMultiplier' in reward ? 'x' : ''}
                    </span>
                  {/if}

                  {#if i < mission.allRewards.length - 1}
                    <span class="font-bold">•</span>
                  {/if}
                </div>
              {/each}
            {/if}

            {#if mission.missionModifiers.length}
              {#if mission.allRewards.length}
                <span class="font-bold">•</span>
              {/if}

              <div class="flex gap-1">
                {#each mission.missionModifiers as modifier (modifier.id)}
                  <img class="size-6" alt="Modifier icon" src={modifier.imageUrl} />
                {/each}
              </div>
            {/if}
          </span>
        </span>
      </Accordion.Trigger>

      <Accordion.Content class="mt-1 grid grid-cols-2 rounded-sm bg-card px-4 py-2 text-sm">
        {#if mission.alert?.rewards?.length}
          <div class="flex flex-col gap-y-1">
            <h2 class="font-medium">{$t('stwMissionAlerts.alertRewards')}</h2>
            <div class="flex flex-col gap-x-1">
              {#each mission.alert.rewards as reward (reward.itemId)}
                <div class="flex items-center gap-1">
                  <img class="size-4" alt="Alert timer" src="/world/alert.png" />

                  <img class="size-6" alt="Reward icon" src={reward.imageUrl} />

                  {#if reward.quantity > 1}
                    <span class="font-medium">
                      {reward.quantity.toLocaleString($language)}
                    </span>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <div class="flex flex-col gap-y-1">
          <h2 class="font-medium">{$t('stwMissionAlerts.rewards')}</h2>
          <div class="flex flex-col gap-x-1">
            {#each mission.rewards as reward (reward.itemId)}
              <div class="flex gap-1">
                <img class="size-6" alt="Reward icon" src={reward.imageUrl} />

                {#if reward.quantity > 1}
                  <span class="font-medium">
                    × {reward.quantity.toLocaleString($language)}
                  </span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  {/each}
</Accordion.Root>
