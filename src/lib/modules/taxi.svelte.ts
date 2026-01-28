import { ConnectionEvents, EpicEvents } from '$lib/constants/events';
import Friends from '$lib/modules/friends';
import Party from '$lib/modules/party';
import XMPPManager from '$lib/modules/xmpp';
import { SvelteSet } from 'svelte/reactivity';
import homebaseRatingMapping from '$lib/data/homebase-rating-mapping.json';
import { accountPartiesStore } from '$lib/stores';
import { t } from '$lib/i18n';
import { get } from 'svelte/store';
import { getChildLogger } from '$lib/logger';
import type { AccountData } from '$types/account';
import type {
  EpicEventFriendRequest,
  EpicEventMemberJoined,
  EpicEventMemberKicked,
  EpicEventMemberLeft,
  EpicEventMemberNewCaptain,
  EpicEventMemberStateUpdated,
  EpicEventPartyPing,
  EpicEventPartyUpdated
} from '$types/game/events';

const FORT_STATS_KEY = 'Default:FORTStats_j';
const FORT_STATS_KEYS = [
  'fortitude', 'offense', 'resistance', 'tech',
  'teamFortitude', 'teamOffense', 'teamResistance', 'teamTech',
  'fortitude_Phoenix', 'offense_Phoenix', 'resistance_Phoenix', 'tech_Phoenix',
  'teamFortitude_Phoenix', 'teamOffense_Phoenix', 'teamResistance_Phoenix', 'teamTech_Phoenix'
];

const logger = getChildLogger('TaxiManager');

export default class TaxiManager {
  public static readonly taxiAccountIds = new SvelteSet<string>();

  private xmpp?: XMPPManager;
  private abortController?: AbortController;
  private partyTimeoutId?: number;

  public active = $state(false);
  public isStarting = $state(false);
  public isStopping = $state(false);
  public isAvailable = $state(false);
  public level = $state(145);
  public availableStatus = $state(get(t)('taxiService.settings.availableStatus.default'));
  public busyStatus = $state(get(t)('taxiService.settings.busyStatus.default'));
  public autoAcceptFriendRequests = $state(false);

  constructor(private account: AccountData) { }

  async start() {
    this.isStarting = true;
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    try {
      this.xmpp = await XMPPManager.new(this.account, 'taxiService');
      await this.xmpp.connect();

      this.xmpp.on(EpicEvents.PartyInvite, this.handleInvite.bind(this), { signal });
      this.xmpp.on(EpicEvents.FriendRequest, this.handleFriendRequest.bind(this), { signal });
      this.xmpp.on(EpicEvents.MemberNewCaptain, this.handleNewCaptain.bind(this), { signal });
      this.xmpp.on(EpicEvents.MemberJoined, this.handlePartyStateChange.bind(this), { signal });
      this.xmpp.on(EpicEvents.MemberLeft, this.handlePartyStateChange.bind(this), { signal });
      this.xmpp.on(EpicEvents.MemberKicked, this.handlePartyStateChange.bind(this), { signal });
      this.xmpp.on(EpicEvents.MemberStateUpdated, this.handlePartyStateChange.bind(this), { signal });
      this.xmpp.on(EpicEvents.PartyUpdated, this.handlePartyStateChange.bind(this), { signal });
      this.xmpp.on(ConnectionEvents.Disconnected, () => this.stop(), { signal });

      this.setIsAvailable(true);

      await Party.get(this.account);

      this.active = true;
      TaxiManager.taxiAccountIds.add(this.account.accountId);

      this.handleFriendRequests();
    } catch (error) {
      this.isStarting = false;
      this.active = false;
      TaxiManager.taxiAccountIds.delete(this.account.accountId);

      throw error;
    } finally {
      this.isStarting = false;
    }
  }

  async stop() {
    this.isStopping = true;

    if (this.partyTimeoutId) {
      window.clearTimeout(this.partyTimeoutId);
      this.partyTimeoutId = undefined;
    }

    this.abortController?.abort();
    this.abortController = undefined;

    this.xmpp?.removePurpose('taxiService');
    this.xmpp = undefined;

    this.isStopping = false;
    this.active = false;
    TaxiManager.taxiAccountIds.delete(this.account.accountId);
  }

  async handleFriendRequests() {
    if (!this.active || !this.autoAcceptFriendRequests) return;

    const incomingRequests = await Friends.getIncoming(this.account);
    if (incomingRequests.length) {
      logger.debug('Accepting all incoming friend requests', {
        accountId: this.account.accountId,
        count: incomingRequests.length
      });

      await Friends.acceptAllIncomingRequests(this.account, incomingRequests.map((x) => x.accountId));
    }
  }

  setIsAvailable(available: boolean) {
    if (available === this.isAvailable) return;

    if (available) {
      logger.debug('Setting taxi availability to available', { accountId: this.account.accountId });
      this.xmpp!.setStatus(this.availableStatus, 'online');
      this.isAvailable = true;
    } else {
      logger.debug('Setting taxi availability to busy', { accountId: this.account.accountId });
      this.xmpp!.setStatus(this.busyStatus, 'away');
      this.isAvailable = false;
    }
  }

  setPowerLevel(partyId: string, revision: number) {
    logger.debug('Setting power level', { accountId: this.account.accountId, partyId, level: this.level });
    return Party.sendPatch(this.account, partyId, revision, this.getUpdatePayload(), true);
  }

  private async handleInvite(invite: EpicEventPartyPing) {
    logger.debug('Accepting party invite', { accountId: this.account.accountId, inviterId: invite.pinger_id });

    const currentParty = accountPartiesStore.get(this.account.accountId);
    if (currentParty?.members.length === 1) {
      await Party.leave(this.account, currentParty.id);
      accountPartiesStore.delete(this.account.accountId);
    }

    const [inviterPartyData] = await Party.getInviterParty(this.account, invite.pinger_id);
    await Party.acceptInvite(this.account, inviterPartyData.id, invite.pinger_id, this.xmpp!.connection!.jid, this.getUpdatePayload());
    await Party.get(this.account);

    this.setIsAvailable(false);

    if (this.partyTimeoutId) {
      window.clearTimeout(this.partyTimeoutId);
    }

    this.partyTimeoutId = window.setTimeout(async () => {
      const currentParty = accountPartiesStore.get(this.account.accountId);
      if (currentParty) {
        await Party.leave(this.account, currentParty.id);
        accountPartiesStore.delete(this.account.accountId);
        this.setIsAvailable(true);
      }
    }, 180_000);
  }

  private async handlePartyStateChange(event: EpicEventMemberJoined | EpicEventMemberLeft | EpicEventMemberKicked | EpicEventMemberStateUpdated | EpicEventPartyUpdated) {
    if (event.type === EpicEvents.MemberJoined && event.account_id === this.account.accountId) {
      return this.setPowerLevel(event.party_id, event.revision);
    }

    if ('member_state_updated' in event) {
      const packedState = JSON.parse(event.member_state_updated['Default:PackedState_j']?.replaceAll('True', 'true') || '{}')?.PackedState;
      if (packedState?.location === 'Lobby') {
        return Party.leave(this.account, event.party_id);
      }
    }

    const currentParty = accountPartiesStore.get(this.account.accountId);
    const isInParty = (currentParty?.members.length || 0) > 1;

    if (isInParty) {
      this.setIsAvailable(false);
    } else {
      this.setIsAvailable(true);

      if (this.partyTimeoutId) {
        window.clearTimeout(this.partyTimeoutId);
        this.partyTimeoutId = undefined;
      }
    }
  }

  private async handleNewCaptain(data: EpicEventMemberNewCaptain) {
    if (data.account_id === this.account.accountId) {
      logger.debug('The taxi account was made party captain, leaving party', {
        accountId: this.account.accountId,
        partyId: data.party_id
      });

      await Party.leave(this.account, data.party_id);
    }
  }

  private async handleFriendRequest(request: EpicEventFriendRequest) {
    if (!this.autoAcceptFriendRequests || request.status !== 'PENDING') return;

    logger.debug('Accepting friend request', { accountId: this.account.accountId, from: request.from });
    await Friends.addFriend(this.account, request.from);
  }

  private getUpdatePayload() {
    const fort = getFORT(this.level);
    return {
      [FORT_STATS_KEY]: JSON.stringify({
        FORTStats: FORT_STATS_KEYS.reduce<Record<string, number>>((acc, key) => {
          acc[key] = fort;
          return acc;
        }, {})
      }),
      'Default:CampaignCommanderLoadoutRating_d': `${this.level}.00000`,
      'Default:CampaignBackpackRating_d': `${this.level}.00000`
    };
  }
}

function getFORT(powerLevel: number) {
  const firstTime = homebaseRatingMapping.at(0)!.Time;
  const lastTime = homebaseRatingMapping.at(-1)!.Time;

  const minPowerLevel = Math.round(evaluateCurve(homebaseRatingMapping, firstTime));
  const maxPowerLevel = Math.round(evaluateCurve(homebaseRatingMapping, lastTime));
  if (powerLevel < minPowerLevel || powerLevel > maxPowerLevel) return 0;

  for (let time = 0; time <= lastTime; time++) {
    const current = Math.round(evaluateCurve(homebaseRatingMapping, time));
    if (current === powerLevel) {
      return Math.round(time / 16);
    }
  }

  return 0;
}

function evaluateCurve(keys: { Time: number, Value: number; }[], time: number) {
  if (time < keys[0].Time) {
    return keys[0].Value;
  }

  if (time >= keys[keys.length - 1].Time) {
    return keys[keys.length - 1].Value;
  }

  const index = keys.findIndex((k) => k.Time > time);

  const prev = keys[index - 1];
  const next = keys[index];

  const fac = (time - prev.Time) / (next.Time - prev.Time);
  return prev.Value * (1 - fac) + next.Value * fac;
}