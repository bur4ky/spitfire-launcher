<script lang="ts" module>
  import { SvelteSet } from 'svelte/reactivity';

  const statusSetAccounts = new SvelteSet<string>();
  let isSettingStatus = $state(false);
  let isResettingStatus = $state(false);

  let customStatus = $state<string>();
  let onlineType = $state<'online' | 'away'>('online');
</script>

<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import CustomStatusTutorial from '$components/modules/docs/tutorials/CustomStatus.svelte';
  import TaxiManager from '$lib/modules/taxi.svelte.js';
  import { Button } from '$components/ui/button';
  import { Input } from '$components/ui/input';
  import { toast } from 'svelte-sonner';
  import { handleError } from '$lib/utils';
  import { t } from '$lib/i18n';
  import XMPPManager from '$lib/modules/xmpp';
  import MoonIcon from '@lucide/svelte/icons/moon';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import XIcon from '@lucide/svelte/icons/x';
  import { accountStore } from '$lib/storage';

  const activeAccount = accountStore.getActiveStore();
  const isCustomStatusInUse = $derived(TaxiManager.taxiAccountIds.has($activeAccount.accountId));

  async function setCustomStatus(event: SubmitEvent) {
    event.preventDefault();

    if (!customStatus?.trim()) return;

    isSettingStatus = true;

    try {
      const connection = await XMPPManager.new($activeAccount, 'customStatus');
      await connection.connect();

      connection.setStatus(customStatus, onlineType);
      statusSetAccounts.add($activeAccount.accountId);

      toast.success($t('customStatus.statusSet'));
    } catch (error) {
      handleError({ error, message: $t('customStatus.failedToSetStatus'), account: $activeAccount });
    } finally {
      isSettingStatus = false;
    }
  }

  async function resetStatus() {
    isResettingStatus = true;

    try {
      const connection = await XMPPManager.new($activeAccount, 'customStatus');

      connection.resetStatus();
      connection.removePurpose('customStatus');
      statusSetAccounts.delete($activeAccount.accountId);

      toast.success($t('customStatus.statusReset'));
    } catch (error) {
      handleError({ error, message: $t('customStatus.failedToResetStatus'), account: $activeAccount });
    } finally {
      isResettingStatus = false;
    }
  }
</script>

<PageContent
  center={true}
  description={$t('customStatus.page.description')}
  docsComponent={CustomStatusTutorial}
  title={$t('customStatus.page.title')}
>
  <form class="flex flex-col gap-y-4" onsubmit={setCustomStatus}>
    <div class="relative">
      <Input
        class="pr-18"
        disabled={isCustomStatusInUse}
        placeholder={$t('customStatus.statusPlaceholder')}
        bind:value={customStatus}
      />

      <Button
        class="absolute top-1/2 right-10 -translate-y-1/2 !p-1.5 h-auto {onlineType === 'online' && 'bg-accent'} rounded-sm"
        onclick={() => onlineType = 'online'}
        title={$t('customStatus.onlineTypes.online')}
        type="button"
        variant="ghost"
      >
        <span class="block size-4 bg-[#43a25a] rounded-full"></span>
      </Button>

      <Button
        class="absolute top-1/2 right-2 -translate-y-1/2 !p-1.5 h-auto {onlineType === 'away' && 'bg-accent'} rounded-sm"
        onclick={() => onlineType = 'away'}
        title={$t('customStatus.onlineTypes.away')}
        type="button"
        variant="ghost"
      >
        <MoonIcon class="size-4 text-orange-400 fill-orange-400 fill-orange-40"/>
      </Button>
    </div>

    <div class="flex items-center gap-2">
      <Button
        class="w-full"
        disabled={isSettingStatus || !customStatus?.trim() || isCustomStatusInUse}
        loading={isSettingStatus}
        loadingText={$t('customStatus.settingStatus')}
        type="submit"
      >
        {$t('customStatus.setStatus')}
      </Button>

      <Button
        disabled={isResettingStatus || !statusSetAccounts.has($activeAccount.accountId)}
        onclick={resetStatus}
        size="icon"
        title={$t('customStatus.resetStatus')}
        type="button"
        variant="secondary"
      >
        {#if isResettingStatus}
          <LoaderCircleIcon class="size-4 animate-spin"/>
        {:else}
          <XIcon class="size-4"/>
        {/if}
      </Button>
    </div>
  </form>
</PageContent>
