export type PartyMember = {
  account_id: string;
  meta: Record<string, string>;
  connections: Array<{
    id: string;
    connected_at: string;
    updated_at: string;
    yield_leadership: boolean;
    meta: Record<string, string>;
  }>;
  revision: number;
  updated_at: string;
  joined_at: string;
  role: 'CAPTAIN' | 'MEMBER';
};

export type PartyData = {
  id: string;
  created_at: string;
  updated_at: string;
  config: {
    type: 'DEFAULT';
    joinability: 'INVITE_AND_FORMER' | 'OPEN';
    discoverability: 'ALL' | 'INVITED_ONLY';
    sub_type: 'default';
    max_size: number;
    invite_ttl: number;
    join_confirmation: boolean;
    intention_ttl: number;
  };
  members: Array<PartyMember>;
  applicants: Array<unknown>;
  meta: Record<string, string>;
  invites: Array<unknown>;
  revision: number;
  intentions: Array<unknown>;
};

export type PartyPingData = {
  sent_by: string;
  sent_to: string;
  sent_at: string;
  expires_at: string;
  meta: Record<string, string>;
};

export type FetchPartyResponse = {
  current: Array<PartyData>;
  invites: Array<unknown>;
  pending: Array<unknown>;
  pings: Array<PartyPingData>;
};

export type PartyKickResponse = Record<string, unknown>;

export type PartyInviteResponse = Record<string, unknown>;

export type InviterPartyResponse = Pick<
  PartyData,
  'id' | 'config' | 'created_at' | 'updated_at' | 'revision' | 'meta' | 'members'
> & {
  invites: Array<
    PartyPingData & {
      status: string;
    }
  >;
};
