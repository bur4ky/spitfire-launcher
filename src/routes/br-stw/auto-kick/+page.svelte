<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import AutoKickTutorial from '$components/modules/docs/tutorials/AutoKick.svelte';
  import AccountCombobox from '$components/ui/AccountCombobox.svelte';
  import { Alert } from '$components/ui/alert';
  import { Button } from '$components/ui/button';
  import { Label } from '$components/ui/label';
  import { Switch } from '$components/ui/switch';
  import { t } from '$lib/i18n';
  import { AutoKickBase } from '$lib/modules/autokick/base';
  import { accountStore } from '$lib/storage';
  import { cn } from '$lib/utils';
  import type { AutomationSetting as AutomationSettingWithId } from '$types/settings';
  import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { platform } from '@tauri-apps/plugin-os';

  type AutomationSetting = keyof Omit<AutomationSettingWithId, 'accountId'>;

  const allAccounts = $derived($accountStore.accounts);
  const autoKickDisabledAccounts = $derived(allAccounts.filter((x) => !AutoKickBase.accounts.has(x.accountId)));

  function handleAccountSelect(accountId: string) {
    if (!accountId) return;

    const isAlreadyAdded = AutoKickBase.accounts.has(accountId);
    if (isAlreadyAdded) return;

    const account = allAccounts.find((x) => x.accountId === accountId)!;
    AutoKickBase.addAccount(account, {
      autoKick: true
    });
  }

  const settings: { id: AutomationSetting; label: string }[] = $derived([
    {
      id: 'autoKick',
      label: $t('autoKick.settings.kick')
    },
    {
      id: 'autoClaim',
      label: $t('autoKick.settings.claim')
    },
    {
      id: 'autoTransferMaterials',
      label: $t('autoKick.settings.transferMaterials')
    },
    {
      id: 'autoInvite',
      label: $t('autoKick.settings.invite')
    }
  ]);
</script>

<PageContent
  description={$t('autoKick.page.description')}
  docsComponent={AutoKickTutorial}
  title={$t('autoKick.page.title')}
>
  {#if platform() === 'android' || platform() === 'ios'}
    <Alert
      color="yellow"
      icon={AlertTriangleIcon}
      message={$t('autoKick.mobileIncompatibilityWarning.description')}
      title={$t('autoKick.mobileIncompatibilityWarning.title')}
    />
  {/if}

  <div class="flex flex-col gap-x-6 gap-y-2 text-sm text-muted-foreground sm:flex-row sm:items-center">
    <div class="flex items-center gap-x-2">
      <div class="size-2 rounded-full bg-green-500"></div>
      <span>{$t('autoKick.accountStatus.active')}</span>
    </div>

    <div class="flex items-center gap-x-2">
      <div class="size-2 rounded-full bg-red-500"></div>
      <span>{$t('autoKick.accountStatus.loginExpired')}</span>
    </div>

    <div class="flex items-center gap-x-2">
      <div class="size-2 rounded-full bg-gray-500"></div>
      <span>{$t('autoKick.accountStatus.disconnected')}</span>
    </div>
  </div>

  <AccountCombobox
    autoSelect={false}
    customList={autoKickDisabledAccounts}
    onValueChange={handleAccountSelect}
    type="single"
  />

  {#if AutoKickBase.accounts.size}
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl-plus:grid-cols-4 2xl:grid-cols-5">
      {#each AutoKickBase.accounts as [accountId, automationAccount] (accountId)}
        {@const isLoading = automationAccount.status === 'LOADING'}

        <div class="size-full rounded-md border bg-card">
          <div class="flex items-center justify-between bg-secondary px-4 py-2">
            <div class="flex min-w-0 items-center gap-2">
              <div
                class={cn(
                  'size-2 rounded-full',
                  (automationAccount.status === 'DISCONNECTED' || isLoading) && 'bg-gray-500',
                  automationAccount.status === 'ACTIVE' && 'bg-green-500',
                  automationAccount.status === 'INVALID_CREDENTIALS' && 'bg-red-500'
                )}
              ></div>

              <span class="truncate font-medium">
                {allAccounts.find((x) => x.accountId === accountId)?.displayName}
              </span>
            </div>

            <Button
              class="flex size-8 items-center justify-center hover:bg-muted-foreground/50 hover:text-destructive"
              disabled={isLoading}
              onclick={() => AutoKickBase.removeAccount(accountId)}
              size="sm"
              variant="ghost"
            >
              {#if isLoading}
                <RefreshCwIcon class="size-4 animate-spin cursor-not-allowed! opacity-50" />
              {:else}
                <Trash2Icon class="size-4" />
              {/if}
            </Button>
          </div>

          <div class="divide-y px-4">
            {#each settings as setting (setting.id)}
              <div class="flex items-center justify-between space-x-8 py-2.5">
                <Label class="text-sm font-normal" for={setting.id}>{setting.label}</Label>
                <Switch
                  id={setting.id}
                  checked={automationAccount.settings[setting.id]}
                  disabled={isLoading || (setting.id === 'autoInvite' && !automationAccount.settings.autoKick)}
                  onCheckedChange={(checked) => AutoKickBase.updateSettings(accountId, { [setting.id]: checked })}
                />
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</PageContent>
