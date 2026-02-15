export type IncomingFriendRequestData = {
  accountId: string;
  mutual: number;
  favorite: boolean;
  created: string;
};

export type OutgoingFriendRequestData = {
  accountId: string;
  mutual: number;
  favorite: boolean;
  created: string;
};

export type BlockedAccountData = {
  accountId: string;
  created: string;
};

export type FriendData = {
  accountId: string;
  mutual: number;
  alias: string;
  note: string;
  favorite: boolean;
  created: string;
};

export type FriendsSummary = {
  friends: FriendData[];
  incoming: IncomingFriendRequestData[];
  outgoing: OutgoingFriendRequestData[];
  blocklist: BlockedAccountData[];
  limitsReached: {
    incoming: boolean;
    outgoing: boolean;
    accepted: boolean;
  };
};
