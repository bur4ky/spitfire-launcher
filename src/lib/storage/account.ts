import { getChildLogger } from '$lib/logger';
import { accountDataFileSchema } from '$lib/schemas/account';
import FileStore from '$lib/storage/file-store';
import type { AccountData, AccountDataFile } from '$types/account';
import { derived, type Readable } from 'svelte/store';

const logger = getChildLogger('AccountStore');

export default class AccountStore extends FileStore<AccountDataFile> {
  constructor() {
    super('accounts', { accounts: [] }, accountDataFileSchema);
  }

  add(account: AccountData, setActive = true) {
    this.set((state) => {
      state.accounts.push(account);

      if (setActive) {
        state.activeAccountId = account.accountId;
      }

      return state;
    });
  }

  remove(id: string) {
    const account = this.getAccount(id);

    this.set((state) => {
      state.accounts = state.accounts.filter((x) => x.accountId !== id);

      if (state.activeAccountId === id) {
        state.activeAccountId = state.accounts[0]?.accountId ?? null;
      }

      return state;
    });

    if (account) {
      void this.cleanupAccount(account);
    }
  }

  getAccount(id: string) {
    return this.get().accounts.find((x) => x.accountId === id) || null;
  }

  getActive() {
    const data = this.get();
    return data.accounts.find((x) => x.accountId === data.activeAccountId) || null;
  }

  // The nullable parameter is useful when the component is behind authentication
  getActiveStore(nullable?: false): Readable<AccountData>;

  getActiveStore(nullable: true): Readable<AccountData | null>;

  getActiveStore(nullable = false): Readable<AccountData | null> {
    return derived(this, ($state) => {
      const account = $state.accounts.find((x) => x.accountId === $state.activeAccountId) ?? null;
      if (!nullable && !account) {
        throw new Error('Active account is required');
      }

      return account;
    });
  }

  setActive(id: string) {
    this.set((state) => {
      state.activeAccountId = id;
      return state;
    });
  }

  private async cleanupAccount(account: AccountData) {
    const [
      { default: AutoKickBase },
      { default: XMPPManager },
      { default: DeviceAuth },
      { default: Legendary }
    ] = await Promise.all([
      import('$lib/modules/autokick/base'),
      import('$lib/modules/xmpp'),
      import('$lib/modules/device-auth'),
      import('$lib/modules/legendary')
    ]);

    AutoKickBase.removeAccount(account.accountId);
    XMPPManager.instances.get(account.accountId)?.disconnect();

    DeviceAuth.delete(account, account.deviceId).catch((error) => {
      logger.error('Failed to delete device auth', { error });
    });

    Legendary.getAccount().then((legAccount) => {
      if (legAccount === account.accountId) {
        Legendary.logout().catch((error) => {
          logger.error('Failed to logout from Legendary', { error });
        });
      }
    });
  }
}