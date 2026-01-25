<script lang="ts" module>
  import type { BulkActionStatus } from '$types/accounts';
  import type { DailyQuestData } from '$types/game/stw/resources';

  type DailyQuest = DailyQuestData & {
    id: string;
    completionProgress: number;
  };

  type QuestStatus = BulkActionStatus<{
    hasFounder: boolean;
    quests: DailyQuest[];
  }>;

  let selectedAccounts = $state<string[]>([]);
  let isFetching = $state(false);
  let canReroll = $state<Record<string, boolean>>({});
  let questStatuses = $state<QuestStatus[]>([]);
  let rerollingQuestId = $state<string | null>(null);
</script>

<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import AccountCombobox from '$components/ui/AccountCombobox.svelte';
  import { Button } from '$components/ui/button';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import MCPManager from '$lib/managers/mcp';
  import { dailyQuests } from '$lib/constants/stw/resources';
  import type { FullQueryProfile } from '$types/game/mcp';
  import BulkResultAccordion from '$components/ui/BulkResultAccordion.svelte';
  import { getAccountsFromSelection, handleError, t } from '$lib/utils';
  import logger from '$lib/utils/logger';
  import { language } from '$lib/storage';

  async function fetchDailyQuests() {
    isFetching = true;
    questStatuses = [];

    const accounts = getAccountsFromSelection(selectedAccounts);
    await Promise.allSettled(accounts.map(async (account) => {
      const status: QuestStatus = { accountId: account.accountId, displayName: account.displayName, data: { hasFounder: false, quests: [] } };

      try {
        const campaignProfile = await MCPManager.clientQuestLogin(account, 'campaign');
        handleQueryProfile(campaignProfile, status);

        if (status.data.quests.length) {
          questStatuses.push(status);
        }
      } catch (error) {
        handleError({ error, message: 'Failed to fetch daily quests', account, toastId: false });
      }
    }));

    isFetching = false;
  }

  function handleQueryProfile(queryProfile: FullQueryProfile<'campaign'>, status: QuestStatus) {
    const profile = queryProfile.profileChanges[0].profile;
    const items = profile.items;

    canReroll[profile.accountId] = (profile.stats.attributes.quest_manager?.dailyQuestRerolls || 0) > 0;
    status.data.quests = [];
    status.data.hasFounder = Object.values(items).some((item) => item.templateId === 'Token:receivemtxcurrency');

    const dailyQuestsItems = Object.entries(items)
      .filter(([, item]) => item.templateId.startsWith('Quest:') && item.attributes.quest_state === 'Active')
      .map(([id, item]) => ({ id, ...item }));

    for (const item of dailyQuestsItems) {
      const quest = dailyQuests[item.templateId.split(':')[1].toLowerCase()];
      if (!quest) continue;

      const completionKey = Object.keys(item.attributes).find((attr) => attr.includes('completion'))!;
      const completionProgress = item.attributes[completionKey] || 0;

      status.data.quests.push({
        id: item.id,
        names: quest.names,
        completionProgress,
        limit: quest.limit,
        rewards: quest.rewards
      });
    }
  }

  async function rerollQuest(accountId: string, questId: string) {
    rerollingQuestId = questId;

    const account = getAccountsFromSelection([accountId])[0];
    if (!account) {
      rerollingQuestId = null;
      return;
    }

    try {
      const rerollResponse = await MCPManager.compose<FullQueryProfile<'campaign'>>(account, 'FortRerollDailyQuest', 'campaign', { questId });
      const status = questStatuses.find((status) => status.accountId === accountId);
      if (status) {
        handleQueryProfile(rerollResponse, status);
      }
    } catch (error) {
      logger.warn('Failed to reroll daily quest', { accountId, questId, error });
    } finally {
      rerollingQuestId = null;
    }
  }
</script>

<PageContent center={true} title={$t('dailyQuests.page.title')}>
  <AccountCombobox
    disabled={isFetching}
    type="multiple"
    bind:value={selectedAccounts}
  />

  <Button
    class="w-full"
    disabled={!selectedAccounts?.length || isFetching}
    loading={isFetching}
    loadingText={$t('dailyQuests.loading')}
    onclick={fetchDailyQuests}
    type="submit"
  >
    {$t('dailyQuests.getQuests')}
  </Button>

  {#if !isFetching && questStatuses.length}
    <BulkResultAccordion statuses={questStatuses}>
      {#snippet content(status)}
        <div class="p-3 space-y-3">
          {#each status.data.quests as quest (quest.id)}
            {@const rewards = [
              {
                name: $t('stw.gold'),
                icon: '/resources/eventcurrency_scaling.png',
                amount: quest.rewards.gold
              },
              {
                name: status.data.hasFounder ? $t('vbucks') : $t('stw.xrayTickets'),
                icon: status.data.hasFounder ? '/resources/currency_mtxswap.png' : '/resources/currency_xrayllama.png',
                amount: quest.rewards.mtx
              },
              {
                name: $t('xp'),
                icon: '/misc/battle-royale-xp.png',
                amount: quest.rewards.xp
              }
            ]}

            <div class="border rounded-md p-3">
              <div class="flex flex-col xs:flex-row xs:items-center justify-between gap-3 mb-4 relative {canReroll[status.accountId] && 'pr-10'}">
                <h3 class="font-medium">{quest.names[$language]}</h3>

                <span class="font-medium">{quest.completionProgress}/{quest.limit}</span>

                {#if canReroll[status.accountId]}
                  <Button
                    class="flex items-center justify-center absolute top-0 right-0 size-8"
                    disabled={!!rerollingQuestId}
                    onclick={() => rerollQuest(status.accountId, quest.id)}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCwIcon class={rerollingQuestId === quest.id ? 'animate-spin': ''}/>
                  </Button>
                {/if}
              </div>


              <div class="flex justify-around">
                {#each rewards as reward (reward.name)}
                  {#if reward.amount > 0}
                    <div class="flex items-center gap-2 bg-accent/50 p-2 rounded">
                      <img class="size-6" alt={reward.name} src={reward.icon}/>
                      <span class="font-medium">{reward.amount.toLocaleString($language)}</span>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/snippet}
    </BulkResultAccordion>
  {/if}
</PageContent>
