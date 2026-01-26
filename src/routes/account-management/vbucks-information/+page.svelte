<script lang="ts" module>
  import type { BulkStatus } from '$types/accounts';

  type VBucksStatus = BulkStatus<{
    vbucksAmount?: number;
    error?: string;
  }>;

  let selectedAccounts = $state<string[]>([]);
  let isFetching = $state(false);
  let vbucksStatuses = $state<VBucksStatus[]>([]);
</script>

<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import AccountCombobox from '$components/ui/AccountCombobox.svelte';
  import { Button } from '$components/ui/button';
  import MCP from '$lib/modules/mcp';
  import { calculateVbucks, getAccountsFromSelection, handleError, t } from '$lib/utils';
  import EpicAPIError from '$lib/exceptions/EpicAPIError';
  import { language } from '$lib/storage';

  async function fetchVbucksData(event: SubmitEvent) {
    event.preventDefault();

    isFetching = true;
    vbucksStatuses = [];

    const accounts = getAccountsFromSelection(selectedAccounts);
    await Promise.allSettled(accounts.map(async (account) => {
      const status: VBucksStatus = { accountId: account.accountId, displayName: account.displayName, data: { vbucksAmount: 0 } };
      vbucksStatuses.push(status);

      try {
        const queryProfile = await MCP.queryProfile(account, 'common_core');
        status.data.vbucksAmount = calculateVbucks(queryProfile);
      } catch (error) {
        handleError({ error, message: 'Failed to fetch V-Bucks information', account, toastId: false });

        status.data.error = error instanceof EpicAPIError && error.errorCode === 'errors.com.epicgames.account.invalid_account_credentials'
          ? $t('vbucksInformation.loginExpired')
          : $t('vbucksInformation.unknownError');
      }
    }));

    isFetching = false;
  }
</script>

<PageContent center={true} title={$t('vbucksInformation.page.title')}>
  <form class="flex flex-col gap-y-2" onsubmit={fetchVbucksData}>
    <AccountCombobox
      disabled={isFetching}
      type="multiple"
      bind:value={selectedAccounts}
    />

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

  {#if !isFetching && vbucksStatuses.length}
    <div class="flex flex-col p-2 border rounded-md">
      {#each vbucksStatuses as status (status.accountId)}
        <div class="flex gap-x-2">
          <p class="font-medium">{status.displayName}:</p>

          {#if status.data.error}
            <p class="text-red-500">{status.data.error}</p>
          {:else}
            <div class="flex items-center gap-x-1">
              <p>{status.data.vbucksAmount!.toLocaleString($language)}</p>
              <img
                class="size-5"
                alt="V-Bucks"
                src="/resources/currency_mtxswap.png"
              />
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</PageContent>
