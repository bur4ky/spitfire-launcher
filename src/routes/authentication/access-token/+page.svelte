<script lang="ts" module>
  let generatingAccessToken = $state(false);
</script>

<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import { Button } from '$components/ui/button';
  import { Authentication } from '$lib/modules/authentication';
  import { toast } from 'svelte-sonner';
  import { handleError } from '$lib/utils';
  import { t } from '$lib/i18n';
  import { writeText } from '@tauri-apps/plugin-clipboard-manager';
  import * as Select from '$components/ui/select';
  import KeyRound from '@lucide/svelte/icons/key-round';
  import MonitorSmartphone from '@lucide/svelte/icons/monitor-smartphone';
  import {
    defaultClient,
    fortniteAndroidGameClient,
    fortnitePCGameClient,
    launcherAppClient2
  } from '$lib/constants/clients';
  import { accountStore } from '$lib/storage';
  import type { EpicTokenType } from '$types/game/authorizations';

  let selectedTokenType = $state<EpicTokenType>();
  const tokenTypeOptions: { label: string; value: EpicTokenType }[] = [
    { label: 'EG1', value: 'eg1' },
    { label: 'Bearer', value: 'bearer' }
  ];

  let selectedClient = $state<string>();
  const allClients = [fortniteAndroidGameClient, fortnitePCGameClient, launcherAppClient2];
  const clientOptions = allClients.map((client) => ({ value: client.clientId, label: client.name }));

  async function generateAccessToken(event: SubmitEvent) {
    event.preventDefault();

    generatingAccessToken = true;

    const account = accountStore.getActive()!;
    try {
      let accessTokenData = await Authentication.getAccessTokenUsingDeviceAuth(account, selectedTokenType);

      if (selectedClient !== defaultClient.clientId) {
        const { code } = await Authentication.getExchangeCodeUsingAccessToken(accessTokenData.access_token);

        const client = allClients.find((client) => client.clientId === selectedClient);
        accessTokenData = await Authentication.getAccessTokenUsingExchangeCode(code, client, selectedTokenType);
      }

      await writeText(accessTokenData.access_token);
      toast.success($t('accessToken.generated'));
    } catch (error) {
      handleError({ error, message: $t('accessToken.failedToGenerate'), account });
    } finally {
      generatingAccessToken = false;
    }
  }
</script>

<PageContent center={true} title={$t('accessToken.page.title')}>
  <form class="flex flex-col gap-y-2" onsubmit={generateAccessToken}>
    <Select.Root type="single" bind:value={selectedTokenType}>
      <Select.Trigger class="w-full">
        <KeyRound class="size-5" />
        {tokenTypeOptions.find((option) => option.value === selectedTokenType)?.label
          || $t('accessToken.selectTokenType')}
      </Select.Trigger>

      <Select.Content>
        {#each tokenTypeOptions as option (option.value)}
          <Select.Item value={option.value}>
            {option.label}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>

    <Select.Root type="single" bind:value={selectedClient}>
      <Select.Trigger class="w-full">
        <MonitorSmartphone class="size-5" />
        {clientOptions.find((option) => option.value === selectedClient)?.label
          || $t('accessToken.selectClient')}
      </Select.Trigger>

      <Select.Content>
        {#each clientOptions as option (option.value)}
          <Select.Item value={option.value}>
            {option.label}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>

    <Button
      class="mt-2"
      disabled={generatingAccessToken || !selectedTokenType || !selectedClient}
      loading={generatingAccessToken}
      loadingText={$t('accessToken.generating')}
      type="submit"
    >
      {$t('accessToken.generate')}
    </Button>
  </form>
</PageContent>
