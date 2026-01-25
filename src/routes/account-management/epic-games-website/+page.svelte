<script lang="ts" module>
  let isLoggingIn = $state(false);
  let isCopying = $state(false);
</script>

<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import { Button } from '$components/ui/button';
  import Authentication from '$lib/utils/epic/authentication';
  import { openUrl } from '@tauri-apps/plugin-opener';
  import { toast } from 'svelte-sonner';
  import { handleError, t } from '$lib/utils';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import { writeText } from '@tauri-apps/plugin-clipboard-manager';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import { accountStore } from '$lib/storage';

  const activeAccount = accountStore.getActiveStore();

  async function openEpicGamesWebsite() {
    isLoggingIn = true;

    try {
      const url = await generateLoginURL();
      await openUrl(url);

      toast.success($t('epicGamesWebsite.openedWebsite'));
    } catch (error) {
      handleError({ error, message: $t('epicGamesWebsite.failedToOpenWebsite'), account: $activeAccount });
    } finally {
      isLoggingIn = false;
    }
  }

  async function copyWebsiteLink() {
    isCopying = true;

    try {
      const url = await generateLoginURL();
      await writeText(url);

      toast.success($t('epicGamesWebsite.copied'));
    } catch (error) {
      handleError({ error, message: $t('epicGamesWebsite.failedToCopy'), account: $activeAccount });
    } finally {
      isCopying = false;
    }
  }

  async function generateLoginURL() {
    const accessTokenData = await Authentication.getAccessTokenUsingDeviceAuth($activeAccount);
    const exchangeCodeData = await Authentication.getExchangeCodeUsingAccessToken(accessTokenData.access_token);
    return `https://www.epicgames.com/id/exchange?exchangeCode=${exchangeCodeData.code}`;
  }
</script>

<PageContent
  center={true}
  description={$t('epicGamesWebsite.page.description')}
  title={$t('epicGamesWebsite.page.title')}
>
  <div class="flex items-center gap-2">
    <Button
      class="flex-1"
      disabled={isLoggingIn || isCopying}
      loading={isLoggingIn}
      loadingText={$t('epicGamesWebsite.loggingIn')}
      onclick={openEpicGamesWebsite}
    >
      {$t('epicGamesWebsite.login')}
    </Button>

    <Button
      disabled={isLoggingIn || isCopying}
      onclick={copyWebsiteLink}
      size="icon"
      variant="secondary"
    >
      {#if isCopying}
        <LoaderCircleIcon class="size-4 animate-spin"/>
      {:else}
        <CopyIcon class="size-4"/>
      {/if}
    </Button>
  </div>
</PageContent>
