<script lang="ts" module>
  import type { BulkState } from '$types/account';
  import type { DailyQuestData } from '$types/game/stw/resources';

  type DailyQuest = DailyQuestData & {
    id: string;
    completionProgress: number;
  };

  type QuestState = BulkState<{
    hasFounder: boolean;
    quests: DailyQuest[];
  }>;

  let selectedAccounts = $state<string[]>([]);
  let isFetching = $state(false);
  let canReroll = $state<Record<string, boolean>>({});
  let questStates = $state<QuestState[]>([]);
  let rerollingQuestId = $state<string | null>(null);
</script>

<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import AccountCombobox from '$components/ui/AccountCombobox.svelte';
  import { Button } from '$components/ui/button';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import { MCP } from '$lib/modules/mcp';
  import { dailyQuests } from '$lib/constants/stw/resources';
  import type { FullQueryProfile } from '$types/game/mcp';
  import BulkResultAccordion from '$components/ui/BulkResultAccordion.svelte';
  import { getAccountsFromSelection, handleError } from '$lib/utils';
  import { t } from '$lib/i18n';
  import { logger } from '$lib/logger';
  import { language } from '$lib/i18n';

  async function fetchDailyQuests() {
    isFetching = true;
    questStates = [];

    const accounts = getAccountsFromSelection(selectedAccounts);
    await Promise.allSettled(
      accounts.map(async (account) => {
        const state: QuestState = {
          accountId: account.accountId,
          displayName: account.displayName,
          data: { hasFounder: false, quests: [] }
        };

        try {
          const campaignProfile = await MCP.clientQuestLogin(account, 'campaign');
          handleQueryProfile(campaignProfile, state);

          if (state.data.quests.length) {
            questStates.push(state);
          }
        } catch (error) {
          handleError({ error, message: 'Failed to fetch daily quests', account, toastId: false });
        }
      })
    );

    isFetching = false;
  }

  function handleQueryProfile(queryProfile: FullQueryProfile<'campaign'>, state: QuestState) {
    const profile = queryProfile.profileChanges[0].profile;
    const items = profile.items;

    canReroll[profile.accountId] = (profile.stats.attributes.quest_manager?.dailyQuestRerolls || 0) > 0;
    state.data.quests = [];
    state.data.hasFounder = Object.values(items).some((item) => item.templateId === 'Token:receivemtxcurrency');

    const dailyQuestsItems = Object.entries(items)
      .filter(([, item]) => item.templateId.startsWith('Quest:') && item.attributes.quest_state === 'Active')
      .map(([id, item]) => ({ id, ...item }));

    for (const item of dailyQuestsItems) {
      const quest = dailyQuests[item.templateId.split(':')[1].toLowerCase()];
      if (!quest) continue;

      const completionKey = Object.keys(item.attributes).find((attr) => attr.includes('completion'))!;
      const completionProgress = item.attributes[completionKey] || 0;

      state.data.quests.push({
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
      const rerollResponse = await MCP.compose<FullQueryProfile<'campaign'>>(
        account,
        'FortRerollDailyQuest',
        'campaign',
        { questId }
      );
      const state = questStates.find((x) => x.accountId === accountId);
      if (state) {
        handleQueryProfile(rerollResponse, state);
      }
    } catch (error) {
      logger.warn('Failed to reroll daily quest', { accountId, questId, error });
    } finally {
      rerollingQuestId = null;
    }
  }
</script>

<PageContent center={true} title={$t('dailyQuests.page.title')}>
  <AccountCombobox disabled={isFetching} type="multiple" bind:value={selectedAccounts} />

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

  {#if !isFetching && questStates.length}
    <BulkResultAccordion states={questStates}>
      {#snippet content(state)}
        <div class="space-y-3 p-3">
          {#each state.data.quests as quest (quest.id)}
            {@const rewards = [
              {
                name: $t('stw.gold'),
                icon: '/resources/eventcurrency_scaling.png',
                amount: quest.rewards.gold
              },
              {
                name: state.data.hasFounder ? $t('vbucks') : $t('stw.xrayTickets'),
                icon: state.data.hasFounder ? '/resources/currency_mtxswap.png' : '/resources/currency_xrayllama.png',
                amount: quest.rewards.mtx
              },
              {
                name: $t('xp'),
                icon: '/misc/battle-royale-xp.png',
                amount: quest.rewards.xp
              }
            ]}

            <div class="rounded-md border p-3">
              <div
                class="relative mb-4 flex flex-col justify-between gap-3 xs:flex-row xs:items-center {canReroll[
                  state.accountId
                ] && 'pr-10'}"
              >
                <h3 class="font-medium">{quest.names[$language]}</h3>

                <span class="font-medium">{quest.completionProgress}/{quest.limit}</span>

                {#if canReroll[state.accountId]}
                  <Button
                    class="absolute top-0 right-0 flex size-8 items-center justify-center"
                    disabled={!!rerollingQuestId}
                    onclick={() => rerollQuest(state.accountId, quest.id)}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCwIcon class={rerollingQuestId === quest.id ? 'animate-spin' : ''} />
                  </Button>
                {/if}
              </div>

              <div class="flex justify-around">
                {#each rewards as reward (reward.name)}
                  {#if reward.amount > 0}
                    <div class="flex items-center gap-2 rounded bg-accent/50 p-2">
                      <img class="size-6" alt={reward.name} src={reward.icon} />
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
