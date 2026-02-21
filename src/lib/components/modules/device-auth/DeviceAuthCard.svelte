<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$components/ui/button';
  import * as Tooltip from '$components/ui/tooltip';
  import { language, t } from '$lib/i18n';
  import { DeviceAuth } from '$lib/modules/device-auth';
  import { accountStore, deviceAuthsStore } from '$lib/storage';
  import { handleError } from '$lib/utils';
  import type { EpicDeviceAuthData } from '$types/game/authorizations';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import MonitorIcon from '@lucide/svelte/icons/monitor';
  import KeyRoundIcon from '@lucide/svelte/icons/key-round';
  import FingerprintIcon from '@lucide/svelte/icons/fingerprint';
  import MapPinIcon from '@lucide/svelte/icons/map-pin';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import CalendarIcon from '@lucide/svelte/icons/calendar';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import { toast } from 'svelte-sonner';

  type Props = {
    auth: EpicDeviceAuthData;
    allDeviceAuths: Record<string, EpicDeviceAuthData[]>;
  };

  const { auth, allDeviceAuths }: Props = $props();

  const activeAccount = accountStore.getActiveStore();
  let isDeleting = $state(false);

  async function saveDeviceName(event: FocusEvent & { currentTarget: HTMLSpanElement }, deviceId: string) {
    if (!deviceId) return;

    const newName = event.currentTarget.textContent?.trim();
    if (!newName) {
      event.currentTarget.textContent = $t('deviceAuth.authInfo.noName');
      deviceAuthsStore.remove(deviceId);
    } else {
      deviceAuthsStore.setName(deviceId, newName);
    }
  }

  async function deleteDeviceAuth(deviceId: string) {
    isDeleting = true;

    const toastId = toast.loading($t('deviceAuth.deleting'));
    const isCurrentDevice = deviceId === $activeAccount.deviceId;

    try {
      if (isCurrentDevice) {
        // This will also delete the device auth
        accountStore.remove($activeAccount.accountId);
      } else {
        await DeviceAuth.delete($activeAccount, deviceId);
      }

      allDeviceAuths[$activeAccount.accountId] = allDeviceAuths[$activeAccount.accountId].filter(
        (auth) => auth.deviceId !== deviceId
      );
      toast.success(isCurrentDevice ? $t('deviceAuth.deletedAndLoggedOut') : $t('deviceAuth.deleted'), { id: toastId });

      if (isCurrentDevice) {
        allDeviceAuths[$activeAccount.accountId] = [];
        if (!$activeAccount) await goto('/');
      }
    } catch (error) {
      handleError({ error, message: $t('deviceAuth.failedToDelete'), account: $activeAccount, toastId });
    } finally {
      isDeleting = false;
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString($language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  }
</script>

<div class="flex size-full flex-col rounded-md border bg-card">
  <div class="flex items-center justify-between border-b bg-secondary px-3 py-2">
    <div class="flex items-center gap-2">
      <span
        class="rounded px-1 py-0.5 text-sm font-semibold outline-none focus:ring-1 focus:ring-ring"
        contenteditable
        onblur={(event) => saveDeviceName(event, auth.deviceId)}
        onkeydown={(event) => event.key === 'Enter' && event.preventDefault()}
        role="textbox"
        spellcheck="false"
        tabindex="0"
      >
        {$deviceAuthsStore.find((x) => x.deviceId === auth.deviceId)?.customName || $t('deviceAuth.authInfo.noName')}
      </span>

      {#if auth.deviceId === $activeAccount.deviceId}
        <Tooltip.Root>
          <Tooltip.Trigger class="size-2 rounded-full bg-green-500" />
          <Tooltip.Content>
            {$t('deviceAuth.authInfo.activeAuth')}
          </Tooltip.Content>
        </Tooltip.Root>
      {/if}
    </div>

    <Button
      class="size-8"
      disabled={isDeleting}
      onclick={() => deleteDeviceAuth(auth.deviceId)}
      size="icon"
      variant="ghost"
    >
      <Trash2Icon class="size-4" />
    </Button>
  </div>

  <div class="flex grow flex-col gap-4 p-4">
    <div class="flex flex-col gap-2">
      {#each [{ id: 'deviceId', title: $t('deviceAuth.authInfo.id'), value: auth.deviceId, Icon: FingerprintIcon }, { id: 'secret', title: 'Secret', value: auth.secret, Icon: KeyRoundIcon }, { id: 'userAgent', title: 'User-Agent', value: auth.userAgent, Icon: MonitorIcon }] as { id, title, value, Icon } (id)}
        {#if value}
          <div class="flex gap-2 text-xs">
            <Icon class="mt-0.75 size-3.5 text-muted-foreground" />

            <div class="flex min-w-0 flex-col">
              <span class="font-medium text-muted-foreground">
                {title}
              </span>

              <span class="break-all">
                {value}
              </span>
            </div>
          </div>
        {/if}
      {/each}
    </div>

    {#if auth.created || auth.lastAccess}
      <div class="mt-auto grid grid-cols-1 gap-2 xs:grid-cols-2">
        {#each [{ id: 'created', title: $t('deviceAuth.authInfo.created'), data: auth.created, Icon: CalendarIcon }, { id: 'lastAccess', title: $t('deviceAuth.authInfo.lastAccess'), data: auth.lastAccess, Icon: ClockIcon }] as { id, title, data, Icon } (id)}
          {#if data}
            <div class="flex flex-col gap-2 rounded-md border p-3">
              <div class="flex items-center gap-1.5 text-xs font-semibold">
                <Icon class="size-3.5 text-muted-foreground" />
                <span>{title}</span>
              </div>
              <div class="flex flex-col gap-1.5 text-xs text-muted-foreground">
                <div class="flex items-center gap-1">
                  <MapPinIcon class="size-3" />
                  <span>{data.location}</span>
                </div>
                <div class="flex items-center gap-1">
                  <GlobeIcon class="size-3" />
                  <span>{data.ipAddress}</span>
                </div>
                <div class="flex items-center gap-1">
                  <CalendarIcon class="size-3" />
                  <span>{formatDate(data.dateTime)}</span>
                </div>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</div>
