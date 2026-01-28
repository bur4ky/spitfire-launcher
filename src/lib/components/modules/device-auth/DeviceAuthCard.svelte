<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$components/ui/button';
  import * as Tooltip from '$components/ui/tooltip';
  import DeviceAuth from '$lib/modules/device-auth';
  import { handleError } from '$lib/utils';
  import { language, t } from '$lib/i18n';
  import type { EpicDeviceAuthData } from '$types/game/authorizations';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { toast } from 'svelte-sonner';
  import { accountStore, deviceAuthsStore } from '$lib/storage';

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

      allDeviceAuths[$activeAccount.accountId] = allDeviceAuths[$activeAccount.accountId].filter((auth) => auth.deviceId !== deviceId);
      toast.success(isCurrentDevice ? $t('deviceAuth.deletedAndLoggedOut') : $t('deviceAuth.deleted'), { id: toastId });

      if (isCurrentDevice) {
        allDeviceAuths[$activeAccount.accountId] = [];
        if (!$activeAccount) {
          await goto('/');
        }
      }
    } catch (error) {
      handleError({ error, message: $t('deviceAuth.failedToDelete'), account: $activeAccount, toastId });
    } finally {
      isDeleting = false;
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString($language, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    });
  }
</script>

<div class="border rounded-md p-4 relative size-full bg-card">
  <div class="flex justify-between items-start">
    <div class="flex flex-col gap-y-1">
      <div class="flex items-center gap-2 w-fit mb-1">
        <span
          class="font-semibold outline-none hover:underline underline-offset-2"
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
            <Tooltip.Trigger>
              <div class="size-2 bg-green-500 rounded-full shrink-0"></div>
            </Tooltip.Trigger>
            <Tooltip.Content>
              {$t('deviceAuth.authInfo.activeAuth')}
            </Tooltip.Content>
          </Tooltip.Root>
        {/if}
      </div>

      <div class="flex flex-col gap-y-2">
        {#each [
          { title: $t('deviceAuth.authInfo.id'), value: auth.deviceId },
          { title: 'User-Agent', value: auth.userAgent },
          { title: 'Secret', value: auth.secret }
        ] as { title, value } (title)}
          {#if value}
            <div class="text-sm flex flex-col">
              <span class="font-semibold">{title}</span>
              <span class="text-muted-foreground">{value}</span>
            </div>
          {/if}
        {/each}

        {#each [
          { title: $t('deviceAuth.authInfo.created'), data: auth.created },
          { title: $t('deviceAuth.authInfo.lastAccess'), data: auth.lastAccess }
        ] as { title, data } (title)}
          {#if data}
            <div>
              <span class="font-semibold">{title}</span>
              <div>
                <span class="text-sm font-semibold">{$t('deviceAuth.authInfo.location')}:</span>
                <span class="text-sm text-muted-foreground">{data.location}</span>
              </div>
              <div>
                <span class="text-sm font-semibold">{$t('deviceAuth.authInfo.ip')}:</span>
                <span class="text-sm text-muted-foreground">{data.ipAddress}</span>
              </div>
              <div>
                <span class="text-sm font-semibold">{$t('deviceAuth.authInfo.date')}:</span>
                <span class="text-sm text-muted-foreground">{formatDate(data.dateTime)}</span>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </div>

    <Button
      class="absolute top-4 right-4 p-2"
      disabled={isDeleting}
      onclick={() => deleteDeviceAuth(auth.deviceId)}
      size="sm"
      variant="destructive"
    >
      <Trash2Icon class="size-5"/>
    </Button>
  </div>
</div>