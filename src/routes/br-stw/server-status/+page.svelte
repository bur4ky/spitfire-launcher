<script lang="ts" module>
  type ServiceStatus = {
    status: 'UP' | 'DOWN' | 'MAJOR_OUTAGE' | 'PARTIAL_OUTAGE' | 'UNDER_MAINTENANCE';
    message: string;
  };

  type StatusPageStatus = {
    name: string;
    status: 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage' | 'under_maintenance';
  };

  let isLoading = $state(true);
  let notifyUser = $state(false);
  let notifyUserIntervalId: number;
  let serviceStatus = $state<ServiceStatus>();
  let statusPageServices = $state<StatusPageStatus[]>([]);
  let expectedWait = $state<number>(0);
  let lastUpdated = $state<Date>();
</script>

<script lang="ts">
  import { ExternalLink } from '$components/ui/external-link';
  import { Switch } from '$components/ui/switch';
  import * as Tooltip from '$components/ui/tooltip';
  import { Notification } from '$lib/modules/notification';
  import { ServerStatus } from '$lib/modules/server-status';
  import type { LightswitchData } from '$types/game/server-status';
  import { Separator } from '$components/ui/separator';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import { onMount } from 'svelte';
  import PageContent from '$components/layout/PageContent.svelte';
  import { Button } from '$components/ui/button';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import { formatRemainingDuration, handleError } from '$lib/utils';
  import { t } from '$lib/i18n';
  import { Alert, type AlertColor } from '$components/ui/alert';
  import { accountStore } from '$lib/storage';
  import { language } from '$lib/i18n';

  $effect(() => {
    if (notifyUser) {
      notifyUserIntervalId = window.setInterval(async () => {
        await fetchServerStatus();

        if (serviceStatus?.status === 'UP') {
          notifyUser = false;
          clearInterval(notifyUserIntervalId);

          await Notification.sendNotification(
            $t('serverStatus.notification.message'),
            $t('serverStatus.notification.title')
          );
        }
      }, 15_000);
    } else {
      clearInterval(notifyUserIntervalId);
    }
  });

  async function fetchServerStatus() {
    isLoading = true;

    const activeAccount = accountStore.getActive() || undefined;

    try {
      const [lightswitchData, queueData, statusPageData] = await Promise.all([
        ServerStatus.getLightswitch(),
        ServerStatus.getWaitingRoom(),
        ServerStatus.getStatusPage()
      ]);

      lastUpdated = new Date();
      expectedWait = queueData?.expectedWait || 0;
      serviceStatus = {
        status: getStatusFromLightswitch(lightswitchData),
        message: lightswitchData.message
      };

      const fnComponentIds = statusPageData.components?.find((x) => x.name === 'Fortnite')?.components || [];
      statusPageServices = fnComponentIds.map((id) => {
        const component = statusPageData.components.find((x) => x.id === id);
        return {
          name: component!.name,
          status: component!.status as StatusPageStatus['status']
        };
      });
    } catch (error) {
      handleError({ error, message: $t('serverStatus.failedToFetch'), account: activeAccount });
    } finally {
      isLoading = false;
    }
  }

  function getStatusFromLightswitch(data: LightswitchData): ServiceStatus['status'] {
    if (data.status !== 'UP') {
      if (data.allowedActions && data.allowedActions.includes('PLAY')) {
        return 'PARTIAL_OUTAGE';
      }

      return data.message?.includes('maintenance') ? 'UNDER_MAINTENANCE' : 'MAJOR_OUTAGE';
    }

    return 'UP';
  }

  function getStatusData(status: ServiceStatus['status'] | StatusPageStatus['status']): {
    text: string;
    color: AlertColor;
  } {
    switch (status.toLowerCase()) {
      case 'up':
      case 'operational':
        return { text: $t('serverStatus.statuses.operational'), color: 'green' };
      case 'down':
      case 'major_outage':
        return { text: $t('serverStatus.statuses.down'), color: 'red' };
      case 'partial_outage':
        return { text: $t('serverStatus.statuses.partialOutage'), color: 'orange' };
      case 'under_maintenance':
        return { text: $t('serverStatus.statuses.underMaintenance'), color: 'blue' };
      case 'degraded_performance':
        return { text: $t('serverStatus.statuses.degradedPerformance'), color: 'yellow' };
      default:
        return { text: $t('serverStatus.statuses.unknown'), color: 'gray' };
    }
  }

  onMount(() => {
    fetchServerStatus();
  });
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'F5') {
      event.preventDefault();
      fetchServerStatus();
    }
  }}
/>

<PageContent class="mt-2" title={$t('serverStatus.page.title')}>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <p class="text-sm text-muted-foreground">
        {$t('serverStatus.lastUpdated', { date: lastUpdated ? lastUpdated.toLocaleTimeString($language) : '...' })}
      </p>

      <Button
        class="flex items-center gap-x-2"
        disabled={isLoading}
        onclick={fetchServerStatus}
        size="sm"
        variant="outline"
      >
        {#if isLoading}
          <LoaderCircleIcon class="size-4 animate-spin" />
          {$t('serverStatus.refreshing')}
        {:else}
          <RefreshCwIcon class="size-4" />
          {$t('serverStatus.refresh')}
        {/if}
      </Button>
    </div>

    {#if serviceStatus && serviceStatus.status !== 'UP'}
      <div class="flex items-center justify-between">
        <Tooltip.Root>
          <Tooltip.Trigger>
            {$t('serverStatus.notifyMe.title')}
          </Tooltip.Trigger>

          <Tooltip.Content>
            <p class="max-w-xs text-sm">
              {$t('serverStatus.notifyMe.description')}
            </p>
          </Tooltip.Content>
        </Tooltip.Root>

        <Switch
          onCheckedChange={() => {
            Notification.requestPermission();
          }}
          bind:checked={notifyUser}
        />
      </div>
    {/if}
  </div>

  {#if serviceStatus}
    <Alert
      color={getStatusData(serviceStatus.status).color}
      message={serviceStatus.message}
      title={$t('serverStatus.status', { status: getStatusData(serviceStatus.status).text })}
    />
  {:else}
    <div class="skeleton-loader mb-2 rounded-lg bg-muted/30 p-3">
      <div class="flex items-center gap-2">
        <div class="size-4 rounded-full bg-muted/80"></div>
        <div class="h-5 w-32 rounded bg-muted/80 font-medium"></div>
      </div>

      <div class="mt-3 h-4 w-30 rounded bg-muted/80"></div>
    </div>
  {/if}

  {#if expectedWait}
    <Alert
      color="yellow"
      message={$t('serverStatus.queue.description', { time: formatRemainingDuration(expectedWait * 1000) })}
      title={$t('serverStatus.queue.title')}
    />
  {/if}

  <Separator orientation="horizontal" />

  {#if isLoading && !statusPageServices.length}
    <div class="space-y-3">
      <div class="flex items-center gap-2 text-muted-foreground">
        <div class="skeleton-loader size-4 rounded-full"></div>
        <div class="skeleton-loader h-4 w-40 rounded"></div>
      </div>

      <div class="space-y-3">
        <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
        {#each Array(4) as _, i (i)}
          <div class="skeleton-loader rounded-lg bg-muted/30 p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 truncate">
                <div class="skeleton-loader size-4 rounded-full"></div>
                <div class="skeleton-loader h-6 w-32 rounded max-xs:w-24"></div>
              </div>
              <div class="skeleton-loader h-6 w-20 rounded"></div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else if statusPageServices.length}
    <div class="space-y-2">
      <div class="flex items-center gap-2 text-muted-foreground">
        <ExternalLinkIcon class="size-4" />
        <ExternalLink class="text-sm font-medium hover:underline" href="https://status.epicgames.com">
          status.epicgames.com
        </ExternalLink>
      </div>

      <div class="space-y-3">
        {#each statusPageServices as service (service.name)}
          <div class="flex items-center justify-between rounded-lg bg-card p-4">
            <div class="flex items-center gap-3 truncate">
              <div class="size-3 rounded-full bg-{getStatusData(service.status).color}-500"></div>
              <span class="truncate font-medium max-xs:text-sm">{service.name}</span>
            </div>

            <div class="text-sm">
              {getStatusData(service.status).text}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</PageContent>
