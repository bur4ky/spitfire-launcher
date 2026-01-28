<script lang="ts">
  import SettingItem from '$components/modules/settings/SettingItem.svelte';
  import AccountCombobox from '$components/ui/AccountCombobox.svelte';
  import SettingsFolderPicker from '$components/modules/settings/SettingsFolderPicker.svelte';
  import { Switch } from '$components/ui/switch';
  import DownloadManager from '$lib/modules/download.svelte.js';
  import Legendary from '$lib/modules/legendary';
  import { t } from '$lib/i18n';
  import { handleError } from '$lib/utils';
  import { downloaderSettingsSchema } from '$lib/schemas/settings';
  import type { DownloaderSettings } from '$types/settings';
  import { onMount, untrack } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { tick } from 'svelte';
  import { accountStore, downloaderStore } from '$lib/storage';

  let loadingAccount = $state(true);
  let downloaderAccountId = $state<string>();
  let switchingDownloaderAccount = $state(false);
  let mounted = false;

  $effect(() => {
    const accountId = downloaderAccountId;
    if (mounted) {
      untrack(() => {
        switchDownloaderAccount(accountId);
      });
    }
  });

  type SettingKey = keyof NonNullable<DownloaderSettings>;
  type SettingValue = string | number | boolean;

  async function handleSettingChange<K extends SettingKey, V extends SettingValue = SettingValue>(
    eventOrValue: Event | V,
    key: K
  ) {
    const value = typeof eventOrValue === 'object' && eventOrValue
      ? (eventOrValue.target as HTMLInputElement).value
      : eventOrValue;

    const newSettings: DownloaderSettings = {
      ...$downloaderStore,
      [key]: value
    };

    if (!downloaderSettingsSchema.safeParse(newSettings).success) {
      return toast.error($t('settings.invalidValue'));
    }

    downloaderStore.set(() => newSettings);
  }

  async function switchDownloaderAccount(accountId?: string) {
    switchingDownloaderAccount = true;

    try {
      const { account: currentAccount } = await Legendary.getStatus();
      if (currentAccount) {
        await Legendary.logout();
      }

      if (accountId) {
        const account = accountStore.getAccount(accountId)!;
        await Legendary.login(account);
      }

      toast.success(accountId
        ? $t('settings.downloaderSettings.account.switched')
        : $t('settings.downloaderSettings.account.loggedOut')
      );
    } catch (error) {
      handleError({
        error,
        message: accountId
          ? $t('settings.downloaderSettings.account.failedToSwitch')
          : $t('settings.downloaderSettings.account.failedToLogout')
      });
    } finally {
      switchingDownloaderAccount = false;
    }
  }

  onMount(async () => {
    downloaderAccountId = await Legendary.getAccount() || undefined;
    loadingAccount = false;
    
    await tick();
    mounted = true;
  });
</script>

<div class="space-y-6">
  <SettingItem
    description={$t('settings.downloaderSettings.downloadPath.description')}
    labelFor="downloadPath"
    orientation="vertical"
    title={$t('settings.downloaderSettings.downloadPath.title')}
  >
    <SettingsFolderPicker
      id="downloadPath"
      defaultPath={$downloaderStore.downloadPath}
      onchange={(e) => handleSettingChange(e, 'downloadPath')}
      placeholder={$downloaderStore.downloadPath}
      showClearButton={false}
      value={$downloaderStore.downloadPath}
    />
  </SettingItem>

  <SettingItem
    description={$t('settings.downloaderSettings.account.description')}
    labelFor="account"
    orientation="vertical"
    title={$t('settings.downloaderSettings.account.title')}
  >
    <AccountCombobox
      disabled={switchingDownloaderAccount || loadingAccount || !!DownloadManager.downloadingAppId}
      type="single"
      bind:value={downloaderAccountId}
    />
  </SettingItem>

  <SettingItem
    description={$t('settings.downloaderSettings.noHTTPS.description')}
    labelFor="noHTTPS"
    orientation="horizontal"
    title={$t('settings.downloaderSettings.noHTTPS.title')}
  >
    <Switch
      id="noHTTPS"
      checked={$downloaderStore.noHTTPS}
      onCheckedChange={(checked) => handleSettingChange(checked, 'noHTTPS')}
    />
  </SettingItem>

  <SettingItem
    description={$t('settings.downloaderSettings.autoUpdate.description')}
    labelFor="autoUpdate"
    orientation="horizontal"
    title={$t('settings.downloaderSettings.autoUpdate.title')}
  >
    <Switch
      id="autoUpdate"
      checked={$downloaderStore.autoUpdate}
      onCheckedChange={(checked) => handleSettingChange(checked, 'autoUpdate')}
    />
  </SettingItem>

  <SettingItem
    description={$t('settings.downloaderSettings.sendNotifications.description')}
    labelFor="sendNotifications"
    orientation="horizontal"
    title={$t('settings.downloaderSettings.sendNotifications.title')}
  >
    <Switch
      id="sendNotifications"
      checked={$downloaderStore.sendNotifications}
      onCheckedChange={(checked) => handleSettingChange(checked, 'sendNotifications')}
    />
  </SettingItem>
</div>
