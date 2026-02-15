<script lang="ts" module>
  import type { DailyQuestData } from '$types/game/stw/resources';

  export type DailyQuest = DailyQuestData & {
    id: string;
    completionProgress: number;
    hasFounder: boolean;
  };
</script>

<script lang="ts">
  import * as Accordion from '$components/ui/accordion';
  import { language, t } from '$lib/i18n';

  type Props = {
    dailyQuests: DailyQuest[];
  };

  const { dailyQuests }: Props = $props();
</script>

<Accordion.Root class="grid gap-1 sm:grid-cols-2" type="multiple">
  {#each dailyQuests as quest (quest.id)}
    {@const rewards = [
      {
        id: 'gold',
        name: $t('stw.gold'),
        icon: '/resources/eventcurrency_scaling.png',
        amount: quest.rewards.gold
      },
      {
        id: 'mtx',
        name: quest.hasFounder ? $t('vbucks') : $t('stw.xrayTickets'),
        icon: quest.hasFounder ? '/resources/currency_mtxswap.png' : '/resources/currency_xrayllama.png',
        amount: quest.rewards.mtx
      },
      {
        id: 'xp',
        name: $t('xp'),
        icon: '/misc/battle-royale-xp.png',
        amount: quest.rewards.xp
      }
    ]}

    <Accordion.Item value={quest.id}>
      <Accordion.Trigger class="flex h-10 items-center justify-between rounded-sm bg-secondary px-2">
        <span class="break-after-all text-start font-medium">
          {quest.names[$language]} - {quest.completionProgress} /{quest.limit}
        </span>
      </Accordion.Trigger>

      <Accordion.Content class="mt-1 flex flex-col gap-y-1 rounded-sm bg-secondary px-4 py-2 text-sm">
        <h2 class="font-medium">{$t('lookupPlayers.dailyQuests.rewards')}</h2>
        <div class="flex flex-col gap-x-1">
          {#each rewards as reward (reward.id)}
            <div class="flex gap-1">
              <img class="size-6" alt="Reward icon" src={reward.icon} />

              {#if reward.amount > 1}
                <span class="font-medium">
                  × {reward.amount.toLocaleString($language)}
                </span>
              {/if}
            </div>
          {/each}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  {/each}
</Accordion.Root>
