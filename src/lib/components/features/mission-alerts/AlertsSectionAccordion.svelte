<script lang="ts">
  import * as Accordion from '$components/ui/accordion';
  import { language } from '$lib/storage';
  import type { WorldParsedMission } from '$types/game/stw/world-info';
  import { cn, isLegendaryOrMythicSurvivor, t } from '$lib/utils';

  type Props = {
    missions: WorldParsedMission[];
    claimedMissionAlerts?: Set<string>;
    showAlertClaimedBorder?: boolean;
  };

  const {
    missions,
    claimedMissionAlerts = new Set(),
    showAlertClaimedBorder = true
  }: Props = $props();

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

<Accordion.Root class="grid sm:grid-cols-2 gap-1" type="multiple">
  {#each parsedMissions as mission (mission.guid)}
    <Accordion.Item value={mission.guid}>
      <Accordion.Trigger
        class={cn(
          'flex items-center justify-between px-2 h-10 bg-card rounded-sm',
          mission.alert && claimedMissionAlerts.has(mission.alert.guid) && showAlertClaimedBorder && 'border border-green-500'
        )}
      >

        <span class="flex gap-1 items-center py-0.5">
          {#if mission.zone.iconUrl}
            <img class="size-5" alt="World icon" src={mission.zone.iconUrl} />
          {:else}
            <span
              style="border-color: {mission.zone.color}; color: {mission.zone.color};"
              class="border flex shrink-0 font-bold items-center justify-center relative rounded size-5 text-xs uppercase"
            >
              {mission.zone.letter}
            </span>
          {/if}

          <img class="size-6" alt="Zone icon" src={mission.zone.type.imageUrl} />
          <span class="border shrink-0 pl-0.5 pr-2 py-1 rounded text-xs">⚡{mission.powerLevel}</span>

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
                  <img
                    class="size-6"
                    alt="Modifier icon"
                    src={modifier.imageUrl}
                  />
                {/each}
              </div>
            {/if}
          </span>
        </span>
      </Accordion.Trigger>

      <Accordion.Content class="text-sm mt-1 bg-card rounded-sm grid grid-cols-2 px-4 py-2">
        {#if mission.alert?.rewards?.length}
          <div class="flex flex-col gap-y-1">
            <h2 class="font-medium">{$t('stwMissionAlerts.alertRewards')}</h2>
            <div class="flex flex-col gap-x-1">
              {#each mission.alert.rewards as reward (reward.itemId)}
                <div class="flex items-center gap-1">
                  <img
                    class="size-4"
                    alt="Alert timer"
                    src="/world/alert.png"
                  />

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
