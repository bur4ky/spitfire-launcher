<script lang="ts" module>
  import type { EpicDeviceAuthData } from '$types/game/authorizations';

  let allDeviceAuths = $state<Record<string, EpicDeviceAuthData[]>>({});
  let isFetching = $state(false);
  let isGenerating = $state(false);
</script>

<script lang="ts">
  import DeviceAuthCard from '$components/modules/device-auth/DeviceAuthCard.svelte';
  import SkeletonDeviceAuthCard from '$components/modules/device-auth/SkeletonDeviceAuthCard.svelte';
  import PageContent from '$components/layout/PageContent.svelte';
  import { Separator } from '$components/ui/separator';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { DeviceAuth } from '$lib/modules/device-auth';
  import { handleError } from '$lib/utils';
  import { t } from '$lib/i18n';
  import type { AccountData } from '$types/account';
  import { logger } from '$lib/logger';
  import { accountStore, deviceAuthsStore } from '$lib/storage';

  const activeAccount = accountStore.getActiveStore();
  const deviceAuths = $derived(allDeviceAuths[$activeAccount.accountId] || []);

  let errorOccurred = $state(false);

  async function fetchDeviceAuths(account: AccountData, forceRefresh = false) {
    if (isFetching || (!forceRefresh && deviceAuths?.length)) return;

    isFetching = true;
    errorOccurred = false;

    try {
      const data = await DeviceAuth.getAll(account);
      allDeviceAuths[account.accountId] = data.sort((a, b) => {
        const aHasCustomName = $deviceAuthsStore.some((x) => x.deviceId === a.deviceId) ? 1 : 0;
        const bHasCustomName = $deviceAuthsStore.some((x) => x.deviceId === b.deviceId) ? 1 : 0;
        const hasCustomName = bHasCustomName - aHasCustomName;

        const aDate = a.lastAccess?.dateTime || a.created?.dateTime;
        const bDate = b.lastAccess?.dateTime || b.created?.dateTime;
        const dateDifference = aDate && bDate && new Date(bDate).getTime() - new Date(aDate).getTime();

        return hasCustomName || dateDifference || 0;
      });
    } catch (error) {
      errorOccurred = true;
      logger.error('Failed to fetch device authentications', { error });
    } finally {
      isFetching = false;
    }
  }

  async function generateDeviceAuth() {
    if (isGenerating) return;

    isGenerating = true;

    const toastId = toast.loading($t('deviceAuth.generating'));
    try {
      const deviceAuth = await DeviceAuth.create($activeAccount);
      allDeviceAuths[$activeAccount.accountId] = [deviceAuth, ...deviceAuths];
      toast.success($t('deviceAuth.generated'), { id: toastId });
    } catch (error) {
      handleError({ error, message: $t('deviceAuth.failedToGenerate'), account: $activeAccount, toastId });
    } finally {
      isGenerating = false;
    }
  }

  $effect(() => {
    // Only track activeAccount changes
    const account = $activeAccount;
    untrack(() => fetchDeviceAuths(account));
  });
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'F5') {
      event.preventDefault();
      fetchDeviceAuths($activeAccount, true);
    }
  }}
/>

<PageContent>
  {#snippet title()}
    <h2 class="text-4xl font-bold max-xs:max-w-64 max-xs:text-3xl">
      {$t('deviceAuth.page.title')}
    </h2>

    <PlusIcon
      class="ml-1 size-10 cursor-pointer {isGenerating || isFetching ? '!cursor-not-allowed opacity-50' : ''}"
      onclick={generateDeviceAuth}
    />

    <Separator class="h-10" orientation="vertical" />

    <RefreshCwIcon
      class="ml-1.5 size-8 cursor-pointer {isFetching ? 'animate-spin !cursor-not-allowed opacity-50' : ''}"
      onclick={() => fetchDeviceAuths($activeAccount, true)}
    />
  {/snippet}

  {#if errorOccurred}
    <p class="text-red-500">
      {$t('deviceAuth.failedToFetch')}
    </p>
  {:else}
    <div class="grid grid-cols-1 place-items-center gap-4 md:grid-cols-2">
      {#if !isFetching}
        {#each deviceAuths as auth (auth.deviceId)}
          <DeviceAuthCard {allDeviceAuths} {auth} />
        {/each}
      {:else}
        <SkeletonDeviceAuthCard />
        <SkeletonDeviceAuthCard />
      {/if}
    </div>
  {/if}
</PageContent>
