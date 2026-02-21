<script lang="ts">
  import SettingItem from '$components/modules/settings/SettingItem.svelte';
  import { Input } from '$components/ui/input';
  import { Switch } from '$components/ui/switch';
  import { t } from '$lib/i18n';
  import { settingsStore } from '$lib/storage';
  import { type } from '@tauri-apps/plugin-os';
  import { handleSettingChange } from '$components/modules/settings/categories/GeneralSettings.svelte';

  function convertToNumber(event: Event) {
    return Number.parseFloat((event.target as HTMLInputElement).value);
  }
</script>

<div class="space-y-6">
  {#if type() === 'windows'}
    <SettingItem
      description={$t('settings.general.launchArguments.description')}
      labelFor="launchArguments"
      orientation="vertical"
      title={$t('settings.general.launchArguments.title')}
    >
      <Input
        id="launchArguments"
        onchange={(e) => handleSettingChange(e, 'launchArguments')}
        value={$settingsStore.app?.launchArguments}
      />
    </SettingItem>
  {/if}

  <SettingItem
    description={$t('settings.general.missionCheckInterval.description')}
    labelFor="missionCheckInterval"
    orientation="vertical"
    title={$t('settings.general.missionCheckInterval.title')}
  >
    <Input
      id="missionCheckInterval"
      max={10}
      min={1}
      onchange={(e) => handleSettingChange(convertToNumber(e), 'missionCheckInterval')}
      type="number"
      value={$settingsStore.app?.missionCheckInterval}
    />
  </SettingItem>

  <SettingItem
    description={$t('settings.general.claimRewardsDelay.description')}
    labelFor="claimRewardsDelay"
    orientation="vertical"
    title={$t('settings.general.claimRewardsDelay.title')}
  >
    <Input
      id="claimRewardsDelay"
      max={10}
      min={1}
      onchange={(e) => handleSettingChange(convertToNumber(e), 'claimRewardsDelay')}
      type="number"
      value={$settingsStore.app?.claimRewardsDelay}
    />
  </SettingItem>

  <SettingItem labelFor="debugLogs" orientation="horizontal" title={$t('settings.general.debugLogs')}>
    <Switch
      id="debugLogs"
      checked={$settingsStore.app?.debugLogs}
      onCheckedChange={(checked) => handleSettingChange(checked, 'debugLogs')}
    />
  </SettingItem>
</div>
