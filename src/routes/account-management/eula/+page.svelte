<script lang="ts" module>
  import type { BulkState } from '$types/accounts';

  type EULAState = BulkState<{
    acceptLink?: string;
  }>;

  let selectedAccounts = $state<string[]>([]);
  let isFetching = $state(false);
  let eulaStates = $state<EULAState[]>([]);
</script>

<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import AccountCombobox from '$components/ui/AccountCombobox.svelte';
  import { Button } from '$components/ui/button';
  import { ExternalLink } from '$components/ui/external-link';
  import { launcherAppClient2 } from '$lib/constants/clients';
  import EULA from '$lib/modules/eula';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import { toast } from 'svelte-sonner';
  import Authentication from '$lib/modules/authentication';
  import EpicAPIError from '$lib/exceptions/EpicAPIError';
  import { getAccountsFromSelection, handleError, t } from '$lib/utils';

  async function checkEULA(event: SubmitEvent) {
    event.preventDefault();

    isFetching = true;
    eulaStates = [];

    const accounts = getAccountsFromSelection(selectedAccounts);
    await Promise.allSettled(accounts.map(async (account) => {
      const state: EULAState = { accountId: account.accountId, displayName: account.displayName, data: {} };
      eulaStates.push(state);

      try {
        // TODO: Shortest way I could find. Might change later
        const accessTokenData = await Authentication.getAccessTokenUsingDeviceAuth(account);
        const exchangeData = await Authentication.getExchangeCodeUsingAccessToken(accessTokenData.access_token);
        const launcherAccessTokenData = await Authentication.getAccessTokenUsingExchangeCode(exchangeData.code, launcherAppClient2);
        await Authentication.getExchangeCodeUsingAccessToken(launcherAccessTokenData.access_token);
      } catch (error) {
        if (
          error instanceof EpicAPIError
          && error.errorCode === 'errors.com.epicgames.oauth.corrective_action_required'
          && error.continuationUrl
        ) {
          state.data.acceptLink = error.continuationUrl;
        } else {
          handleError({ error, message: 'EULA acceptance check failed', account, toastId: false });
        }
      }
      
      const gameEULAData = await EULA.check(account).catch(() => null);
      if (gameEULAData) {
        try {
          await EULA.accept(account, gameEULAData.version)
        } catch (error) {
          handleError({ error, message: 'Failed to accept EULA', account, toastId: false });
        }
      }
    }));

    eulaStates = eulaStates.filter((x) => x.data.acceptLink);

    if (!eulaStates.length) {
      toast.info($t('eula.allAccountsAlreadyAccepted'));
    }

    isFetching = false;
  }
</script>

<PageContent center={true} title={$t('eula.page.title')}>
  <form class="flex flex-col gap-y-2" onsubmit={checkEULA}>
    <AccountCombobox
      disabled={isFetching}
      type="multiple"
      bind:value={selectedAccounts}
    />

    <Button
      class="mt-2"
      disabled={!selectedAccounts?.length || isFetching}
      loading={isFetching}
      loadingText={$t('eula.checking')}
      type="submit"
    >
      {$t('eula.check')}
    </Button>
  </form>

  {#if !isFetching && eulaStates.length}
    <div class="mt-4 space-y-4">
      {#each eulaStates as state (state.accountId)}
        <div class="flex items-center justify-between px-3 py-2 bg-muted border rounded-lg">
          <span class="font-semibold truncate">{state.displayName}</span>

          <ExternalLink
            class="hover:bg-muted-foreground/10 flex size-8 items-center justify-center rounded-md"
            href={state.data.acceptLink!}
          >
            <ExternalLinkIcon class="size-5"/>
          </ExternalLink>
        </div>
      {/each}
    </div>
  {/if}
</PageContent>
