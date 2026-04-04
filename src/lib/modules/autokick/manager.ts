import { ConnectionEvents, EpicEvents } from '$lib/constants/events';
import { getChildLogger } from '$lib/logger';
import { AutoKickBase } from '$lib/modules/autokick/base';
import { claimRewards } from '$lib/modules/autokick/claim-rewards';
import { transferBuildingMaterials } from '$lib/modules/autokick/transfer-building-materials';
import { Friends } from '$lib/modules/friends';
import { MCP } from '$lib/modules/mcp';
import { Party } from '$lib/modules/party';
import { XMPPManager } from '$lib/modules/xmpp';
import { accountStore, settingsStore } from '$lib/storage';
import { accountPartiesStore } from '$lib/stores';
import { sleep } from '$lib/utils';
import type { AccountData } from '$types/account';
import type { PartyData } from '$types/game/party';

const logger = getChildLogger('AutoKickManager');

type State = 'lobby' | 'mission' | 'endgame';

export class AutoKickManager {
  private abortController = new AbortController();
  private scheduleTimeout?: number;
  private checkerInterval?: number;

  private currentState: State = 'lobby';
  private matchesPlayed?: number;

  private constructor(
    private account: AccountData,
    private xmpp: XMPPManager
  ) {}

  static async new(account: AccountData) {
    const accountId = account.accountId;
    AutoKickBase.updateStatus(accountId, 'LOADING');

    let xmpp: XMPPManager;
    try {
      xmpp = await XMPPManager.new(account, 'autoKick');
    } catch (error) {
      AutoKickBase.updateStatus(accountId, 'INVALID_CREDENTIALS');
      throw error;
    }

    const manager = new AutoKickManager(account, xmpp);
    const signal = manager.abortController.signal;

    xmpp.on(
      ConnectionEvents.SessionStarted,
      async () => {
        AutoKickBase.updateStatus(accountId, 'ACTIVE');

        const state = await manager.checkState();
        manager.currentState = state;
        logger.debug('Initial mission state polled', { accountId, state });

        if (state === 'mission') {
          manager.startMissionChecker();
        }

        if (state === 'endgame') {
          manager.resetState();
          await manager.postMissionActions();
        }
      },
      { signal }
    );

    xmpp.on(
      ConnectionEvents.Disconnected,
      () => {
        AutoKickBase.updateStatus(accountId, 'DISCONNECTED');
        manager.resetState();
      },
      { signal }
    );

    xmpp.on(
      EpicEvents.MemberDisconnected,
      (data) => {
        if (data.account_id !== accountId) return;
        manager.resetState();
      },
      { signal }
    );

    xmpp.on(
      EpicEvents.MemberExpired,
      (data) => {
        if (data.account_id !== accountId) return;
        manager.resetState();
      },
      { signal }
    );

    xmpp.on(
      EpicEvents.MemberJoined,
      (data) => {
        if (data.account_id !== accountId) return;

        logger.debug('Member joined detected', { accountId });
        manager.scheduleMissionChecker(30_000);
      },
      { signal }
    );

    xmpp.on(
      EpicEvents.PartyUpdated,
      async (data) => {
        const partyState = data.party_state_updated?.['Default:PartyState_s'];
        if (partyState === 'PostMatchmaking' && manager.currentState === 'lobby') {
          logger.debug('PostMatchmaking detected');
          manager.scheduleMissionChecker(60_000);
        }
      },
      { signal }
    );

    try {
      await xmpp.connect();
      AutoKickBase.updateStatus(accountId, 'ACTIVE');
    } catch (error) {
      logger.error('XMPP connection failed', { accountId, error });
      AutoKickBase.updateStatus(accountId, 'DISCONNECTED');
    }

    return manager;
  }

  scheduleMissionChecker(timeout: number) {
    logger.debug('Scheduling mission checker', { accountId: this.account.accountId, timeout });

    clearTimeout(this.scheduleTimeout);
    this.scheduleTimeout = window.setTimeout(() => {
      this.startMissionChecker();
    }, timeout);
  }

  startMissionChecker() {
    const interval = (settingsStore.get().app?.missionCheckInterval || 5) * 1000;
    logger.debug('Starting mission checker', { accountId: this.account.accountId, interval });

    clearInterval(this.checkerInterval);
    this.checkerInterval = window.setInterval(async () => {
      const accountId = this.account.accountId;
      const state = await this.checkState();
      const previousState = this.currentState;
      this.currentState = state;

      logger.debug('Mission state polled', { accountId, state });

      if (state === 'endgame') {
        this.resetState();
        await this.postMissionActions();
        return;
      }

      if (state === 'lobby') {
        this.resetState();

        // If the user was kicked, previousState would be 'mission'
        if (previousState === 'mission') {
          await this.postMissionActions();
        }
      }
    }, interval);
  }

  resetState() {
    this.currentState = 'lobby';
    this.matchesPlayed = undefined;

    clearInterval(this.checkerInterval);
    this.checkerInterval = undefined;
    clearTimeout(this.scheduleTimeout);
    this.scheduleTimeout = undefined;
  }

  destroy() {
    this.abortController.abort();
    this.resetState();
    this.xmpp?.removePurpose('autoKick');
  }

  private async checkState(): Promise<State> {
    const party = accountPartiesStore.get(this.account.accountId) || (await Party.get(this.account)).current[0];
    const partyState = party?.meta['Default:PartyState_s'];
    if (!party || partyState !== 'PostMatchmaking') {
      return 'lobby';
    }

    const queryProfile = await MCP.queryProfile(this.account, 'campaign');
    const newMatchesPlayed = queryProfile.profileChanges[0].profile.stats.attributes.matches_played;

    if (this.matchesPlayed == null) {
      this.matchesPlayed = newMatchesPlayed;
      return 'mission';
    }

    if (newMatchesPlayed > this.matchesPlayed) {
      this.matchesPlayed = newMatchesPlayed;
      return 'endgame';
    }

    return 'mission';
  }

  private async postMissionActions() {
    const accountId = this.account.accountId;
    const settings = AutoKickBase.accounts.get(accountId)?.settings || {};

    logger.debug('Post-mission actions started', { accountId, settings });

    const partyData = await Party.get(this.account);
    const party = partyData.current[0] as PartyData | undefined;

    let kickPromise: Promise<unknown> = Promise.resolve();
    if (settings.autoKick && party) {
      logger.debug('Running auto-kick', { accountId, partyId: party.id });

      kickPromise = this.kick(party).catch((error) => {
        logger.error('Auto-kick failed', { accountId, error });
      });
    }

    if (settings.autoClaim) {
      logger.debug('Running auto-claim rewards', { accountId });

      claimRewards(this.account).catch((error) => {
        logger.error('Auto-claim rewards failed', { accountId, error });
      });
    }

    if (settings.autoTransferMaterials) {
      logger.debug('Running auto-transfer building materials', { accountId });

      kickPromise.finally(() => {
        transferBuildingMaterials(this.account).catch((error) => {
          logger.error('Auto-transfer building materials failed', { accountId, error });
        });
      });
    }

    if (party && settings.autoKick && settings.autoInvite && party.members.length > 1) {
      logger.debug('Running auto-invite', { accountId });

      kickPromise.finally(() => {
        this.invite(party.members).catch((error) => {
          logger.error('Auto-invite failed', { accountId, error });
        });
      });
    }
  }

  private async kick(party: PartyData) {
    const { accounts } = accountStore.get();

    const memberIds = party.members.map((x) => x.account_id);
    const leaderId = party.members.find((x) => x.role === 'CAPTAIN')!.account_id;
    const leaderAccount = accounts.find((x) => x.accountId === leaderId);

    const autoKickIds = memberIds.filter((x) => AutoKickBase.accounts.get(x)?.settings.autoKick);
    const noAutoKickIds = memberIds.filter((x) => !autoKickIds.includes(x));

    if (leaderAccount) {
      await Promise.allSettled(
        noAutoKickIds.filter((id) => id !== this.account.accountId).map((id) => Party.kick(leaderAccount, party.id, id))
      );

      return Party.leave(this.account, party.id);
    }

    const leaveAccounts = accounts.filter((acc) => noAutoKickIds.includes(acc.accountId));
    leaveAccounts.push(this.account);

    return Promise.allSettled(leaveAccounts.map((x) => Party.leave(x, party.id)));
  }

  private async invite(members: PartyData['members']) {
    await this.xmpp.waitForEvent(EpicEvents.MemberJoined, (x) => x.account_id === this.account.accountId, 20_000);
    await sleep(10_000);

    const [partyData, friends] = await Promise.allSettled([Party.get(this.account), Friends.getFriends(this.account)]);

    const party = partyData.status === 'fulfilled' ? partyData.value.current[0] : null;
    if (!party || friends.status === 'rejected' || !friends.value.length) {
      return [];
    }

    const prevMemberIds = members.map((x) => x.account_id).filter((x) => x !== this.account.accountId);
    return Promise.allSettled(
      friends.value
        .filter((x) => prevMemberIds.includes(x.accountId))
        .map((x) => Party.invite(this.account, party.id, x.accountId))
    );
  }
}
