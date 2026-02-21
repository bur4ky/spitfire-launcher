<script lang="ts" module>
  import type { BulkState } from '$types/account';

  type XPState = BulkState<{
    battleRoyale: number;
    creative: number;
    saveTheWorld: number;
  }>;

  let selectedAccounts = $state<string[]>([]);
  let isFetching = $state(false);
  let xpStates = $state<XPState[]>([]);
</script>

<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import { Button } from '$components/ui/button';
  import { Progress } from '$components/ui/progress';
  import AccountCombobox from '$components/ui/AccountCombobox.svelte';
  import { getAccountsFromSelection, handleError } from '$lib/utils';
  import { t } from '$lib/i18n';
  import { MCP } from '$lib/modules/mcp';
  import BulkResultAccordion from '$components/ui/BulkResultAccordion.svelte';
  import { language } from '$lib/i18n';

  async function fetchXPData() {
    isFetching = true;
    xpStates = [];

    const accounts = getAccountsFromSelection(selectedAccounts);
    await Promise.allSettled(
      accounts.map(async (account) => {
        const state: XPState = {
          accountId: account.accountId,
          displayName: account.displayName,
          data: { battleRoyale: 0, saveTheWorld: 0, creative: 0 }
        };
        xpStates.push(state);

        const [athena, campaign] = await Promise.allSettled([
          MCP.queryProfile(account, 'athena'),
          MCP.queryProfile(account, 'campaign')
        ]);

        if (athena.status === 'fulfilled') {
          const attributes = athena.value.profileChanges[0].profile.stats.attributes;
          state.data.creative = attributes.creative_dynamic_xp?.currentWeekXp || 0;
          state.data.battleRoyale = attributes.playtime_xp?.currentWeekXp || 0;
        } else {
          handleError({ error: athena.reason, message: 'Failed to fetch Athena profile', account, toastId: false });
        }

        if (campaign.status === 'fulfilled') {
          const items = Object.values(campaign.value.profileChanges[0].profile.items);
          const xpItem = items.find((item) => item.templateId === 'Token:stw_accolade_tracker');
          if (xpItem) {
            state.data.saveTheWorld = xpItem.attributes?.weekly_xp || 0;
          }
        } else {
          handleError({ error: campaign.reason, message: 'Failed to fetch Campaign profile', account, toastId: false });
        }
      })
    );

    isFetching = false;
  }

  function getNextDayOfWeek(dayIndex: number, hours = 0) {
    const now = new Date();
    const currentDay = now.getDay();
    const daysUntilTarget = (7 + dayIndex - currentDay) % 7;

    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const nextDay = new Date();
    nextDay.setUTCDate(now.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
    nextDay.setUTCHours(hours, 0, 0, 0);

    return nextDay;
  }
</script>

<PageContent center={true} description={$t('earnedXP.page.description')} title={$t('earnedXP.page.title')}>
  <form class="flex flex-col gap-y-4" onsubmit={fetchXPData}>
    <AccountCombobox disabled={isFetching} type="multiple" bind:value={selectedAccounts} />

    <Button
      disabled={!selectedAccounts?.length || isFetching}
      loading={isFetching}
      loadingText={$t('earnedXP.loading')}
      onclick={fetchXPData}
    >
      {$t('earnedXP.check')}
    </Button>
  </form>

  {#if !isFetching && xpStates.length}
    <BulkResultAccordion states={xpStates}>
      {#snippet content(state)}
        {@const gamemodes = [
          {
            id: 'battleRoyale',
            name: $t('gameModes.battleRoyale'),
            value: state.data.battleRoyale || 0,
            limit: 4_000_000
          },
          {
            id: 'creative',
            name: $t('gameModes.creative'),
            value: state.data.creative || 0,
            limit: 4_000_000
          },
          {
            id: 'saveTheWorld',
            name: $t('gameModes.saveTheWorld'),
            value: state.data.saveTheWorld || 0,
            limit: 3_400_000
          }
        ]}

        <div class="space-y-6 bg-muted/30 p-3">
          {#each gamemodes as gamemode (gamemode.id)}
            {@const resetDate = gamemode.id === 'saveTheWorld' ? getNextDayOfWeek(4, 0) : getNextDayOfWeek(0, 13)}

            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <img class="size-4" alt="XP Icon" src="/misc/battle-royale-xp.png" />
                  <span class="font-medium">{gamemode.name}</span>
                </div>

                <div class="text-sm">
                  <span class="font-medium">{gamemode.value.toLocaleString($language)}</span>
                  <span class="text-muted-foreground">
                    / {new Intl.NumberFormat($language, {
                      notation: 'compact',
                      compactDisplay: 'short'
                    }).format(gamemode.limit)}
                  </span>
                </div>
              </div>

              <Progress value={(gamemode.value / gamemode.limit) * 100} />

              <div class="mt-1 text-sm text-muted-foreground">
                {$t('earnedXP.resetsAt', { time: resetDate.toLocaleString($language) })}
              </div>
            </div>
          {/each}
        </div>
      {/snippet}
    </BulkResultAccordion>
  {/if}
</PageContent>
