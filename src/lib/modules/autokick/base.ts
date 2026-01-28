import { SvelteMap } from 'svelte/reactivity';
import AutoKickManager from '$lib/modules/autokick/manager';
import type { AccountData } from '$types/account';
import type { AutomationSetting } from '$types/settings';
import { accountStore, automationStore } from '$lib/storage';

export type AutomationAccount = {
  status: 'LOADING' | 'ACTIVE' | 'INVALID_CREDENTIALS' | 'DISCONNECTED';
  account: AccountData;
  settings: Partial<Omit<AutomationSetting, 'accountId'>>;
  manager?: AutoKickManager;
};

export default class AutoKickBase {
  static accounts = new SvelteMap<string, AutomationAccount>();

  static async init() {
    const accounts = automationStore.get();
    if (!accounts?.length) return;

    const userAccounts = accountStore.get().accounts;
    await Promise.allSettled(accounts.map(async (automationAccount) => {
      const account = userAccounts.find((a) => a.accountId === automationAccount.accountId);
      const isAnySettingEnabled = Object.entries(automationAccount).filter(([key]) => key !== 'accountId').some(([, value]) => value);

      if (!account || !isAnySettingEnabled) {
        automationStore.set((s) => s.filter((a) => a.accountId !== automationAccount.accountId));
        return;
      }

      await AutoKickBase.addAccount(account, automationAccount, false);
    }));
  }

  static async addAccount(account: AccountData, settings: AutomationAccount['settings'] = {}, writeToFile = true) {
    if (AutoKickBase.accounts.has(account.accountId)) return;

    const data: AutomationAccount = {
      status: 'LOADING',
      account,
      settings
    };

    AutoKickBase.accounts.set(account.accountId, data);
    AutoKickBase.updateSettings(account.accountId, settings, writeToFile);

    const manager = await AutoKickManager.new(account);
    AutoKickBase.accounts.set(account.accountId, {
      ...AutoKickBase.accounts.get(account.accountId)!,
      manager
    });
  }

  static removeAccount(accountId: string) {
    AutoKickBase.accounts.get(accountId)?.manager?.destroy();
    AutoKickBase.accounts.delete(accountId);

    automationStore.set(() => AutoKickBase.accounts.values().toArray().map((x) => ({
      accountId: x.account.accountId,
      ...x.settings
    })));
  }

  static updateSettings(accountId: string, settings: Partial<AutomationSetting>, writeToFile = true) {
    const account = AutoKickBase.accounts.get(accountId);
    if (!account) return;

    AutoKickBase.accounts.set(accountId, {
      ...account,
      settings: {
        ...account.settings,
        ...settings
      }
    });

    if (writeToFile) {
      automationStore.set(() => AutoKickBase.accounts.values().toArray().map((x) => ({
        accountId: x.account.accountId,
        ...x.settings
      })));
    }
  }

  static updateStatus(accountId: string, status: AutomationAccount['status']) {
    const account = AutoKickBase.accounts.get(accountId);
    if (!account) return;

    AutoKickBase.accounts.set(accountId, {
      ...account,
      status
    });
  }
}