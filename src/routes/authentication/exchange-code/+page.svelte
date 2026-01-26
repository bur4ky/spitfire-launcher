<script lang="ts" module>
  let generatingExchangeCode = $state(false);
</script>

<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import { Button } from '$components/ui/button';
  import Authentication from '$lib/epic/authentication';
  import { toast } from 'svelte-sonner';
  import { handleError, t } from '$lib/utils';
  import { writeText } from '@tauri-apps/plugin-clipboard-manager';
  import { accountStore } from '$lib/storage';

  async function openEpicGamesWebsite() {
    generatingExchangeCode = true;

    const account = accountStore.getActive()!;
    try {
      const accessTokenData = await Authentication.getAccessTokenUsingDeviceAuth(account);
      const { code } = await Authentication.getExchangeCodeUsingAccessToken(accessTokenData.access_token);

      await writeText(code);
      toast.success($t('exchangeCode.generated'));
    } catch (error) {
      handleError({ error, message: $t('exchangeCode.failedToGenerate'), account });
    } finally {
      generatingExchangeCode = false;
    }
  }
</script>

<PageContent
  center={true}
  description={$t('exchangeCode.page.description')}
  title={$t('exchangeCode.page.title')}
>
  <Button
    disabled={generatingExchangeCode}
    loading={generatingExchangeCode}
    loadingText={$t('exchangeCode.generating')}
    onclick={openEpicGamesWebsite}
  >
    {$t('exchangeCode.generate')}
  </Button>
</PageContent>
