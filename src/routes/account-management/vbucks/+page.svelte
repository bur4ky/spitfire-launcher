<script lang="ts" module>
  import type { BulkState } from '$types/account';

  type VBucksState = BulkState<{
    vbucksAmount?: number;
    error?: string;
  }>;

  let selectedAccounts = $state<string[]>([]);
  let isFetching = $state(false);
  let vbucksStates = $state<VBucksState[]>([]);
</script>

<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import AccountCombobox from '$components/ui/AccountCombobox.svelte';
  import { Button } from '$components/ui/button';
  import { EpicAPIError } from '$lib/exceptions/EpicAPIError';
  import { MCP } from '$lib/modules/mcp';
  import { calculateVbucks, getAccountsFromSelection, handleError } from '$lib/utils';
  import { language, t } from '$lib/i18n';

  async function fetchVbucksData(event: SubmitEvent) {
    event.preventDefault();

    isFetching = true;
    vbucksStates = [];

    const accounts = getAccountsFromSelection(selectedAccounts);
    await Promise.allSettled(
      accounts.map(async (account) => {
        const state: VBucksState = {
          accountId: account.accountId,
          displayName: account.displayName,
          data: { vbucksAmount: 0 }
        };
        vbucksStates.push(state);

        try {
          const queryProfile = await MCP.queryProfile(account, 'common_core');
          state.data.vbucksAmount = calculateVbucks(queryProfile);
        } catch (error) {
          handleError({ error, message: 'Failed to fetch V-Bucks information', account, toastId: false });

          state.data.error =
            error instanceof EpicAPIError &&
            error.errorCode === 'errors.com.epicgames.account.invalid_account_credentials'
              ? $t('vbucksInformation.loginExpired')
              : $t('vbucksInformation.unknownError');
        }
      })
    );

    isFetching = false;
  }
</script>

<PageContent center={true} title={$t('vbucksInformation.page.title')}>
  <form class="flex flex-col gap-y-2" onsubmit={fetchVbucksData}>
    <AccountCombobox disabled={isFetching} type="multiple" bind:value={selectedAccounts} />

    <Button
      class="mt-2"
      disabled={!selectedAccounts?.length || isFetching}
      loading={isFetching}
      loadingText={$t('vbucksInformation.loading')}
      type="submit"
    >
      {$t('vbucksInformation.getInformation')}
    </Button>
  </form>

  {#if !isFetching && vbucksStates.length}
    <div class="flex flex-col rounded-md border p-2">
      {#each vbucksStates as state (state.accountId)}
        <div class="flex gap-x-2">
          <p class="font-medium">{state.displayName}:</p>

          {#if state.data.error}
            <p class="text-red-500">{state.data.error}</p>
          {:else}
            <div class="flex items-center gap-x-1">
              <p>{state.data.vbucksAmount!.toLocaleString($language)}</p>
              <img class="size-5" alt="V-Bucks" src="/resources/currency_mtxswap.png" />
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</PageContent>
