<script lang="ts" module>
  import type { BulkStatus } from '$types/accounts';

  type CodeStatus = BulkStatus<Array<{
    code: string;
    error?: string;
  }>>;

  let selectedAccounts = $state<string[]>([]);
  let codesToRedeem = $state<string[]>([]);
  let isRedeeming = $state(false);
  let codeStatuses = $state<CodeStatus[]>([]);
</script>

<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import AccountCombobox from '$components/ui/AccountCombobox.svelte';
  import { Button } from '$components/ui/button';
  import { TagInput } from '$components/ui/tag-input';
  import Code from '$lib/modules/code';
  import EpicAPIError from '$lib/exceptions/EpicAPIError';
  import BulkResultAccordion from '$components/ui/BulkResultAccordion.svelte';
  import { getAccountsFromSelection, handleError, t } from '$lib/utils';

  const humanizedErrors: Record<string, string> = {
    'errors.com.epicgames.coderedemption.code_not_found': $t('redeemCodes.redeemErrors.notFound'),
    'errors.com.epicgames.coderedemption.codeUse_already_used': $t('redeemCodes.redeemErrors.itemsAlreadyOwned'),
    'errors.com.epicgames.coderedemption.multiple_redemptions_not_allowed': $t('redeemCodes.redeemErrors.itemsAlreadyOwned'),
    'errors.com.epicgames.coderedemption.code_used': $t('redeemCodes.redeemErrors.alreadyUsed')
  };

  async function redeemCodes(event: SubmitEvent) {
    event.preventDefault();

    isRedeeming = true;
    codeStatuses = [];

    const nonExistentCodes: string[] = [];
    const invalidCredentialsAccounts: string[] = [];

    const accounts = getAccountsFromSelection(selectedAccounts);
    await Promise.allSettled(accounts.map(async (account) => {
      const status: CodeStatus = { accountId: account.accountId, displayName: account.displayName, data: [] };
      codeStatuses.push(status);

      await Promise.allSettled(codesToRedeem.map(async (code) => {
        if (nonExistentCodes.includes(code)) {
          status.data.push({ code, error: $t('redeemCodes.redeemErrors.notFound') });
          return;
        }

        if (invalidCredentialsAccounts.includes(account.accountId)) {
          status.data.push({ code, error: $t('redeemCodes.loginExpired') });
          return;
        }

        try {
          await Code.redeem(account, code);
          status.data.push({ code });
        } catch (error) {
          handleError({ error, message: 'Failed to redeem code', account, toastId: false });

          let errorString = $t('redeemCodes.redeemErrors.unknownError');

          if (error instanceof EpicAPIError) {
            errorString = humanizedErrors[error.errorCode] || error.errorMessage;

            switch (error.errorCode) {
              case 'errors.com.epicgames.coderedemption.code_not_found': {
                nonExistentCodes.push(code);
                break;
              }
              case 'errors.com.epicgames.account.invalid_account_credentials': {
                errorString = $t('redeemCodes.loginExpired');
                invalidCredentialsAccounts.push(account.accountId);
                break;
              }
            }
          }

          status.data.push({ code, error: errorString });
        }
      }));
    }));

    for (const status of codeStatuses) {
      const successCount = status.data.filter(({ error }) => !error).length;
      status.displayName = `${status.displayName} - ${successCount}/${status.data.length}`;
    }

    codesToRedeem = [];
    isRedeeming = false;
  }
</script>

<PageContent center={true} title={$t('redeemCodes.page.title')}>
  <form class="flex flex-col gap-y-2" onsubmit={redeemCodes}>
    <AccountCombobox
      disabled={isRedeeming}
      type="multiple"
      bind:value={selectedAccounts}
    />

    <TagInput
      placeholder={$t('redeemCodes.codesPlaceholder')}
      bind:items={codesToRedeem}
    />

    <Button
      class="mt-2"
      disabled={!selectedAccounts?.length || !codesToRedeem.length || isRedeeming}
      loading={isRedeeming}
      loadingText={$t('redeemCodes.redeeming')}
      type="submit"
    >
      {$t('redeemCodes.redeemCodes')}
    </Button>
  </form>

  {#if !isRedeeming && codeStatuses.length}
    <BulkResultAccordion statuses={codeStatuses}>
      {#snippet content(status)}
        <div class="p-3 space-y-2 text-sm">
          {#each status.data as { code, error } (code)}
            <div class="flex items-center gap-1 truncate">
              <span class="font-medium">{code}:</span>
              <span class="truncate" class:text-green-500={!error} class:text-red-500={error}>
                {error || $t('redeemCodes.redeemed')}
              </span>
            </div>
          {/each}
        </div>
      {/snippet}
    </BulkResultAccordion>
  {/if}
</PageContent>
