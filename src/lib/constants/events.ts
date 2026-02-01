export const EpicEvents = Object.freeze({
  MemberConnected: 'com.epicgames.social.party.notification.v0.MEMBER_CONNECTED',
  MemberDisconnected: 'com.epicgames.social.party.notification.v0.MEMBER_DISCONNECTED',
  MemberExpired: 'com.epicgames.social.party.notification.v0.MEMBER_EXPIRED',
  MemberJoined: 'com.epicgames.social.party.notification.v0.MEMBER_JOINED',
  MemberKicked: 'com.epicgames.social.party.notification.v0.MEMBER_KICKED',
  MemberLeft: 'com.epicgames.social.party.notification.v0.MEMBER_LEFT',
  MemberStateUpdated: 'com.epicgames.social.party.notification.v0.MEMBER_STATE_UPDATED',
  MemberNewCaptain: 'com.epicgames.social.party.notification.v0.MEMBER_NEW_CAPTAIN',

  PartyUpdated: 'com.epicgames.social.party.notification.v0.PARTY_UPDATED',
  PartyInvite: 'com.epicgames.social.party.notification.v0.PING',

  FriendRequest: 'FRIENDSHIP_REQUEST',
  FriendRemove: 'FRIENDSHIP_REMOVE',

  InteractionNotification: 'com.epicgames.social.interactions.notification.v2'
} as const);

export const ConnectionEvents = Object.freeze({
  SessionStarted: 'session:started',
  StreamError: 'stream:error',
  Connected: 'connected',
  Disconnected: 'disconnected',
  Destroyed: 'destroyed'
} as const);
