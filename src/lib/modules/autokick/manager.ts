import Friends from '$lib/modules/friends';
import XMPPManager from '$lib/modules/xmpp';
import { sleep } from '$lib/utils';
import type { AccountData } from '$types/account';
import Matchmaking from '$lib/modules/matchmaking';
import { ConnectionEvents, EpicEvents } from '$lib/constants/events';
import AutoKickBase from '$lib/modules/autokick/base';
import Party from '$lib/modules/party';
import claimRewards from '$lib/modules/autokick/claim-rewards';
import transferBuildingMaterials from '$lib/modules/autokick/transfer-building-materials';
import type { PartyData } from '$types/game/party';
import { getChildLogger } from '$lib/logger';
import { accountStore, settingsStore } from '$lib/storage';

const logger = getChildLogger('AutoKickManager');

type State = 'lobby' | 'pregame' | 'mission' | 'endgame';

export default class AutoKickManager {
  private abortController = new AbortController();
  private scheduleTimeout?: number;
  private checkerInterval?: number;

  private currentState: State = 'lobby';
  private previousStarted = false;
  private lastKick?: Date;

  private constructor(private account: AccountData, private xmpp: XMPPManager) {}

  static async new(account: AccountData) {
    const accountId = account.accountId;
    AutoKickBase.updateStatus(accountId, 'LOADING');

    const xmpp = await XMPPManager.new(account, 'autoKick').catch(() => null);
    if (!xmpp) {
      AutoKickBase.updateStatus(accountId, 'INVALID_CREDENTIALS');
      throw new Error('Invalid XMPP credentials');
    }

    const manager = new AutoKickManager(account, xmpp);
    const signal = manager.abortController.signal;

    xmpp.on(ConnectionEvents.SessionStarted, async () => {
      AutoKickBase.updateStatus(accountId, 'ACTIVE');

      const state = await manager.checkMissionState();
      manager.currentState = state;

      if (state === 'pregame') {
        manager.scheduleMissionChecker(60_000);
      }

      if (state === 'mission') {
        manager.startMissionChecker();
      }

      if (state === 'endgame') {
        manager.resetState();
        await manager.postMissionActions();
      }
    }, { signal });

    xmpp.on(ConnectionEvents.Disconnected, () => {
      AutoKickBase.updateStatus(accountId, 'DISCONNECTED');
      manager.resetState();
    }, { signal });

    xmpp.on(EpicEvents.MemberDisconnected, (data) => {
      if (data.account_id !== accountId) return;

      manager.resetState();
    }, { signal });

    xmpp.on(EpicEvents.MemberExpired, (data) => {
      if (data.account_id !== accountId) return;

      manager.resetState();
    }, { signal });

    xmpp.on(EpicEvents.MemberJoined, (data) => {
      if (data.account_id !== accountId) return;

      AutoKickBase.updateStatus(accountId, 'ACTIVE');

      // On lobby return after a kick, the game automatically creates a party and fires EpicEvents.MemberJoined
      // So, we delay the mission checker to avoid false mission detection
      if (!manager.lastKick || Date.now() - manager.lastKick.getTime() > 20_000) {
        const delay = 20_000;
        logger.debug('Scheduling mission checker after party join', { delay });
        manager.scheduleMissionChecker(delay);
      }
    }, { signal });

    xmpp.on(EpicEvents.PartyUpdated, async (data) => {
      const partyState = data.party_state_updated?.['Default:PartyState_s'];
      if (partyState === 'PostMatchmaking') {
        const delay = 60_000;
        logger.debug('PostMatchmaking detected, scheduling checker', { delay });
        manager.scheduleMissionChecker(delay);
      }
    }, { signal });

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
      const state = await this.checkMissionState();
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
    this.previousStarted = false;

    clearInterval(this.checkerInterval);
    clearTimeout(this.scheduleTimeout);
  }

  destroy() {
    this.abortController.abort();
    this.resetState();
    this.xmpp?.removePurpose('autoKick');
  }

  private async checkMissionState(): Promise<State> {
    // Instead of spamming findPlayer, we could use the PackedState changes from XMPP
    // but the event doesn't fire when playing solo
    const response = await Matchmaking.findPlayer(this.account, this.account.accountId);
    if (!response?.length) {
      this.previousStarted = false;
      return 'lobby';
    }

    const started = !!response[0]?.started;
    let state: State;

    if (this.previousStarted && !started) {
      state = 'endgame';
    } else if (started) {
      state = 'mission';
    } else {
      // If Auto-Kick starts while the user is in endgame, this will think it’s pregame
      // We can ignore this for now. But might change it later
      state = 'pregame';
    }

    this.previousStarted = started;
    return state;
  }

  private async postMissionActions() {
    const accountId = this.account.accountId;
    const settings = AutoKickBase.accounts.get(accountId)?.settings || {};

    logger.debug('Post-mission actions started', { accountId, settings });

    const partyData = await Party.get(this.account);
    const party = partyData.current[0] as PartyData | undefined;

    this.lastKick = new Date();

    let kickPromise = Promise.resolve();
    if (settings.autoKick && party) {
      logger.debug('Running auto-kick', { accountId, partyId: party.id });

      kickPromise = this.kick(party).catch((error) => {
        logger.error('Auto-kick failed', { accountId, error });
      });
    }

    if (settings.autoClaim) {
      logger.debug('Running auto-claim rewards', { accountId });

      claimRewards(this.account).catch(() => {
        logger.error('Auto-claim rewards failed', { accountId });
      });
    }

    if (settings.autoTransferMaterials) {
      logger.debug('Running auto-transfer building materials', { accountId });

      kickPromise.finally(() => {
        transferBuildingMaterials(this.account).catch(() => {
          logger.error('Auto-transfer building materials failed', { accountId });
        });
      });
    }

    if (
      party
      && settings.autoKick
      && settings.autoInvite
      && party.members.find((x) => x.account_id === this.account.accountId)?.role === 'CAPTAIN'
      && party.members.some((x) => x.account_id !== this.account.accountId)
    ) {
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
        noAutoKickIds
          .filter((id) => id !== this.account.accountId)
          .map((id) => Party.kick(leaderAccount, party.id, id))
      );

      return Party.leave(this.account, party.id);
    }

    const leaveAccounts = noAutoKickIds.map((id) => accounts.find((a) => a.accountId === id)).filter((x) => !!x);
    leaveAccounts.push(this.account);

    return Promise.allSettled(leaveAccounts.map((x) => Party.leave(x, party.id)));
  }

  private async invite(members: PartyData['members']) {
    await this.xmpp.waitForEvent(EpicEvents.MemberJoined, (x) => x.account_id === this.account.accountId, 20_000);
    await sleep(10_000);

    const [partyData, friends] = await Promise.allSettled([
      Party.get(this.account),
      Friends.getFriends(this.account)
    ]);

    const party = partyData.status === 'fulfilled' ? partyData?.value.current[0] : null;
    if (!party || friends.status === 'rejected' || !friends.value.length) return;

    const prevMemberIds = members.map((x) => x.account_id).filter((x) => x !== this.account.accountId);
    return Promise.allSettled(
      friends.value
        .filter((x) => prevMemberIds.includes(x.accountId))
        .map((x) => Party.invite(this.account, party.id, x.accountId))
    );
  }
}
