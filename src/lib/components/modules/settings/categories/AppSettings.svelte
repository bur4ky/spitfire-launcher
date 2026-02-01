<script lang="ts">
  import SettingItem from '$components/modules/settings/SettingItem.svelte';
  import SettingsFolderPicker from '$components/modules/settings/SettingsFolderPicker.svelte';
  import { Input } from '$components/ui/input';
  import * as Select from '$components/ui/select';
  import { Switch } from '$components/ui/switch';
  import { SidebarCategories } from '$lib/constants/sidebar';
  import { language, t } from '$lib/i18n';
  import type { Locale } from '$lib/paraglide/runtime';
  import { allSettingsSchema, appSettingsSchema } from '$lib/schemas/settings';
  import { settingsStore } from '$lib/storage';
  import type { AllSettings } from '$types/settings';
  import { type } from '@tauri-apps/plugin-os';
  import { toast } from 'svelte-sonner';

  const currentPlatform = type();
  const isDesktop = ['windows', 'macos', 'linux'].includes(currentPlatform);

  const locales: { locale: Locale; country: string }[] = [
    { locale: 'de', country: 'germany' },
    { locale: 'en', country: 'usa' },
    { locale: 'es', country: 'spain' },
    { locale: 'fr', country: 'france' },
    { locale: 'pt-br', country: 'portugal' },
    { locale: 'tr', country: 'turkey' }
  ];

  const startingPageValues = Object.values<string>(appSettingsSchema.shape.startingPage.def.innerType.def.entries);
  const startingPageOptions = $derived(SidebarCategories
    .map((category) => category.items)
    .flat()
    .filter((item) => startingPageValues.includes(item.key))
    .map((item) => ({
      label: $t(`${item.key}.page.title`),
      value: item.key
    })));

  type SettingKey = keyof NonNullable<AllSettings['app']>;
  type SettingValue = string | number | boolean | undefined;

  function handleSettingChange<K extends SettingKey, V extends SettingValue = SettingValue>(
    eventOrValue: Event | V,
    key: K
  ) {
    const value = typeof eventOrValue === 'object'
      ? (eventOrValue.target as HTMLInputElement).value
      : eventOrValue;

    const newSettings: AllSettings = {
      ...$settingsStore,
      app: {
        ...$settingsStore.app,
        [key]: value
      }
    };

    if (!allSettingsSchema.safeParse(newSettings).success) {
      return toast.error($t('settings.invalidValue'));
    }

    settingsStore.set(() => newSettings);
  }

  function convertToNumber(event: Event) {
    return Number.parseFloat((event.target as HTMLInputElement).value);
  }
</script>

<div class="space-y-6">
  <SettingItem
    labelFor="language"
    orientation="vertical"
    title={$t('settings.appSettings.language')}
  >
    <Select.Root
      onValueChange={(value) => settingsStore.setLanguage(value as Locale)}
      type="single"
      value={$language}
    >
      <Select.Trigger id="language" class="w-full flex items-center gap-2">
        {@const locale = locales.find((l) => l.locale === $language)}
        <img class="size-5 rounded-sm" alt={locale?.country} src="/flags/{locale?.country}.svg" />
        <span class="truncate">{$t('language', {}, { locale: $language })}</span>
      </Select.Trigger>

      <Select.Content>
        {#each locales as { locale, country } (locale)}
          <Select.Item class="flex items-center gap-2" value={locale}>
            <img class="size-5 rounded-sm" alt={country} src="/flags/{country}.svg" />
            <span class="truncate">{$t('language', {}, { locale })}</span>
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </SettingItem>

  {#if currentPlatform === 'windows'}
    <SettingItem
      labelFor="gamePath"
      orientation="vertical"
      title={$t('settings.appSettings.gamePath')}
    >
      <SettingsFolderPicker
        id="gamePath"
        defaultPath={$settingsStore.app?.gamePath || 'C:/Program Files/Epic Games'}
        onchange={(e) => handleSettingChange(e, 'gamePath')}
        placeholder="C:/Program Files/.../FortniteGame/Binaries/Win64"
        value={$settingsStore.app?.gamePath}
      />
    </SettingItem>

    <SettingItem
      description={$t('settings.appSettings.launchArguments.description')}
      labelFor="launchArguments"
      orientation="vertical"
      title={$t('settings.appSettings.launchArguments.title')}
    >
      <Input
        id="launchArguments"
        onchange={(e) => handleSettingChange(e, 'launchArguments')}
        value={$settingsStore.app?.launchArguments}
      />
    </SettingItem>
  {/if}

  <SettingItem
    description={$t('settings.appSettings.missionCheckInterval.description')}
    labelFor="missionCheckInterval"
    orientation="vertical"
    title={$t('settings.appSettings.missionCheckInterval.title')}
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
    description={$t('settings.appSettings.claimRewardsDelay.description')}
    labelFor="claimRewardsDelay"
    orientation="vertical"
    title={$t('settings.appSettings.claimRewardsDelay.title')}
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

  <SettingItem
    description={$t('settings.appSettings.startingPage.description')}
    labelFor="startingPage"
    orientation="vertical"
    title={$t('settings.appSettings.startingPage.title')}
  >
    <Select.Root
      onValueChange={(value) => handleSettingChange(value, 'startingPage')}
      type="single"
      value={$settingsStore.app?.startingPage}
    >
      <Select.Trigger id="startingPage" class="w-full">
        {startingPageOptions.find((option) => option.value === $settingsStore.app?.startingPage)?.label}
      </Select.Trigger>

      <Select.Content>
        {#each startingPageOptions as option (option.value)}
          <Select.Item value={option.value}>
            {option.label}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </SettingItem>

  {#if isDesktop}
    <SettingItem
      labelFor="discordStatus"
      orientation="horizontal"
      title={$t('settings.appSettings.discordStatus')}
    >
      <Switch
        id="discordStatus"
        checked={$settingsStore.app?.discordStatus}
        onCheckedChange={(checked) => handleSettingChange(checked, 'discordStatus')}
      />
    </SettingItem>

    <SettingItem
      labelFor="hideToTray"
      orientation="horizontal"
      title={$t('settings.appSettings.hideToTray')}
    >
      <Switch
        id="hideToTray"
        checked={$settingsStore.app?.hideToTray}
        onCheckedChange={(checked) => handleSettingChange(checked, 'hideToTray')}
      />
    </SettingItem>
  {/if}

  <SettingItem
    labelFor="checkForUpdates"
    orientation="horizontal"
    title={$t('settings.appSettings.checkForUpdates')}
  >
    <Switch
      id="checkForUpdates"
      checked={$settingsStore.app?.checkForUpdates}
      onCheckedChange={(checked) => handleSettingChange(checked, 'checkForUpdates')}
    />
  </SettingItem>

  <SettingItem
    labelFor="debugLogs"
    orientation="horizontal"
    title={$t('settings.appSettings.debugLogs')}
  >
    <Switch
      id="debugLogs"
      checked={$settingsStore.app?.debugLogs}
      onCheckedChange={(checked) => handleSettingChange(checked, 'debugLogs')}
    />
  </SettingItem>
</div>
