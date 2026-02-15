<script lang="ts" module>
  let generatingExchangeCode = $state(false);
</script>

<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import { Button } from '$components/ui/button';
  import { Authentication } from '$lib/modules/authentication';
  import { AuthSession } from '$lib/modules/auth-session';
  import { toast } from 'svelte-sonner';
  import { handleError } from '$lib/utils';
  import { t } from '$lib/i18n';
  import { writeText } from '@tauri-apps/plugin-clipboard-manager';
  import { accountStore } from '$lib/storage';

  async function openEpicGamesWebsite() {
    generatingExchangeCode = true;

    const account = accountStore.getActive()!;
    try {
      const accessToken = await AuthSession.new(account).getAccessToken(true);
      const { code } = await Authentication.getExchangeCodeUsingAccessToken(accessToken);

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
