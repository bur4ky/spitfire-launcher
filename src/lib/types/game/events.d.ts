export type EpicEventMemberConnected = {
  type: 'com.epicgames.social.party.notification.v0.MEMBER_CONNECTED';
  ns?: string;
  sent: string;
  connection: {
    id: string;
    meta: Record<string, string>;
    connected_at: string;
    updated_at: string;
    yield_leadership: boolean;
  };
  revision: number;
  party_id: string;
  account_id: string;
  account_dn: string;
  member_state_updated: Record<string, string>;
  joined_at: string;
  updated_at: string;
};

export type EpicEventMemberDisconnected = {
  type: 'com.epicgames.social.party.notification.v0.MEMBER_DISCONNECTED';
  ns?: string;
  sent: string;
  connection: {
    id: string;
    meta: Record<string, string>;
    connected_at: string;
    disconnected_at: string;
    updated_at: string;
    yield_leadership: boolean;
  };
  revision: number;
  expires: string;
  party_id: string;
  account_id: string;
  account_dn: string;
  member_state_updated: Record<string, string>;
  joined_at: string;
  updated_at: string;
};

export type EpicEventMemberExpired = {
  type: 'com.epicgames.social.party.notification.v0.MEMBER_EXPIRED';
  ns?: string;
  sent: string;
  revision: number;
  party_id: string;
  account_id: string;
  member_state_updated: Record<string, string>;
};

export type EpicEventMemberJoined = {
  type: 'com.epicgames.social.party.notification.v0.MEMBER_JOINED';
  ns?: string;
  sent: string;
  connection: {
    id: string;
    meta: Record<string, string>;
    connected_at: string;
    updated_at: string;
    yield_leadership: boolean;
  };
  revision: number;
  party_id: string;
  account_id: string;
  account_dn: string;
  member_state_updated: Record<string, string>;
  joined_at: string;
  updated_at: string;
};

export type EpicEventMemberKicked = {
  type: 'com.epicgames.social.party.notification.v0.MEMBER_KICKED';
  ns?: string;
  sent: string;
  revision: number;
  party_id: string;
  account_id: string;
  member_state_updated: Record<string, string>;
};

export type EpicEventMemberLeft = {
  type: 'com.epicgames.social.party.notification.v0.MEMBER_LEFT';
  ns?: string;
  sent: string;
  revision: number;
  party_id: string;
  account_id: string;
  member_state_updated: Record<string, string>;
};

export type EpicEventMemberStateUpdated = {
  type: 'com.epicgames.social.party.notification.v0.MEMBER_STATE_UPDATED';
  ns?: string;
  sent: string;
  revision: number;
  party_id: string;
  account_id: string;
  account_dn: string;
  member_state_removed: string[];
  member_state_updated: Record<string, string>;
  member_state_overridden: Record<string, string>;
  joined_at: string;
  updated_at: string;
};

export type EpicEventMemberNewCaptain = {
  type: 'com.epicgames.social.party.notification.v0.MEMBER_NEW_CAPTAIN';
  ns?: string;
  sent: string;
  revision: number;
  party_id: string;
  account_id: string;
  account_dn: string;
  member_state_updated: Record<string, string>;
  joined_at: string;
  updated_at: string;
};

export type EpicEventPartyUpdated = {
  type: 'com.epicgames.social.party.notification.v0.PARTY_UPDATED';
  ns?: string;
  sent: string;
  party_id: string;
  captain_id: string;
  party_state_removed: string[];
  party_state_updated: Record<string, string>;
  party_state_overridden: Record<string, string>;
  party_privacy_type: 'OPEN' | 'INVITE_AND_FORMER';
  party_type: 'DEFAULT';
  party_sub_type: 'default';
  max_number_of_members: number;
  invite_ttl_seconds: number;
  intention_ttl_seconds: number;
  created_at: string;
  updated_at: string;
  revision: number;
};

export type EpicEventInteractionNotification = {
  type: 'com.epicgames.social.interactions.notification.v2';
  ns?: string;
  interactions: Array<{
    namespace?: string;
    fromAccountId: string;
    toAccountId: string;
    app: string;
    interactionType: 'GamePlayed' | 'PartyInviteSent' | 'PartyJoined' | 'PingSent';
    happenedAt: number;
    interactionScoreIncremental: {
      total: number;
      count: number;
    };
    resultsIncremental: {
      timePlayed: number;
      playlist: number;
      gameType_StW: number;
      timePlayedActive: number;
      startAt: number;
    };
    resultsAction: 'ADD';
    interactionId: string;
    isFriend: boolean;
  }>;
};

export type EpicEventPartyPing = {
  type: 'com.epicgames.social.party.notification.v0.PING';
  ns?: string;
  pinger_dn: string;
  pinger_id: string;
  expires: string;
  sent: string;
  meta: Record<string, string>;
};

export type EpicEventFriendRequest = {
  type: 'FRIENDSHIP_REQUEST';
  from: string;
  to: string;
  status: 'PENDING' | 'ACCEPTED';
  timestamp: string;
};

export type EpicEventFriendRemoved = {
  type: 'FRIENDSHIP_REMOVE';
  from: string;
  to: string;
  reason: 'DELETED';
  timestamp: string;
};
