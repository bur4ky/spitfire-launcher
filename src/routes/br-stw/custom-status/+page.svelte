<script lang="ts" module>
  import { SvelteSet } from 'svelte/reactivity';

  const statusSetAccounts = new SvelteSet<string>();
  let isSettingStatus = $state(false);
  let isResettingStatus = $state(false);

  let customStatus = $state<string>();
  let onlineType = $state<'online' | 'away'>('online');
</script>

<script lang="ts">
  import { toast } from 'svelte-sonner';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import MoonIcon from '@lucide/svelte/icons/moon';
  import XIcon from '@lucide/svelte/icons/x';
  import { t } from '$lib/i18n';
  import { TaxiManager } from '$lib/modules/taxi.svelte.js';
  import { XMPPManager } from '$lib/modules/xmpp';
  import { accountStore } from '$lib/storage';
  import { handleError } from '$lib/utils';
  import PageContent from '$components/layout/PageContent.svelte';
  import { Button } from '$components/ui/button';
  import { Input } from '$components/ui/input';

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

<PageContent center={true} description={$t('customStatus.page.description')} title={$t('customStatus.page.title')}>
  <form class="flex flex-col gap-y-4" onsubmit={setCustomStatus}>
    <div class="relative">
      <Input
        class="pr-18"
        disabled={isCustomStatusInUse}
        placeholder={$t('customStatus.statusPlaceholder')}
        bind:value={customStatus}
      />

      <Button
        class="absolute top-1/2 right-10 h-auto -translate-y-1/2 !p-1.5 {onlineType === 'online' &&
          'bg-accent'} rounded-sm"
        onclick={() => (onlineType = 'online')}
        title={$t('customStatus.onlineTypes.online')}
        type="button"
        variant="ghost"
      >
        <span class="block size-4 rounded-full bg-[#43a25a]"></span>
      </Button>

      <Button
        class="absolute top-1/2 right-2 h-auto -translate-y-1/2 !p-1.5 {onlineType === 'away' &&
          'bg-accent'} rounded-sm"
        onclick={() => (onlineType = 'away')}
        title={$t('customStatus.onlineTypes.away')}
        type="button"
        variant="ghost"
      >
        <MoonIcon class="fill-orange-40 size-4 fill-orange-400 text-orange-400" />
      </Button>
    </div>

    <div class="flex items-center gap-2">
      <Button
        class="flex-1"
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
          <LoaderCircleIcon class="size-4 animate-spin" />
        {:else}
          <XIcon class="size-4" />
        {/if}
      </Button>
    </div>
  </form>
</PageContent>
