<script lang="ts" module>
  export type Friend = {
    accountId: string;
    displayName: string;
    nickname?: string;
    avatarUrl: string;
    createdAt: Date;
  };

  export type ListType = 'friends' | 'incoming' | 'outgoing' | 'blocklist';
</script>

<script lang="ts">
  import BanIcon from '@lucide/svelte/icons/ban';
  import { t } from '$lib/i18n';
  import { accountStore } from '$lib/storage';
  import { avatarCache, displayNameCache, friendsCache } from '$lib/stores';
  import FriendCard from '$components/modules/friends/FriendCard.svelte';
  import type {
    BlockedAccountData,
    FriendData,
    IncomingFriendRequestData,
    OutgoingFriendRequestData
  } from '$types/game/friends';

  type Props = {
    listType: ListType;
    searchQuery?: string;
  };

  const { listType, searchQuery = $bindable() }: Props = $props();

  const list = $derived<Friend[]>(
    friendsCache
      .get($accountStore.activeAccountId!)
      ?.[listType]?.values()
      ?.map((data: FriendData | IncomingFriendRequestData | OutgoingFriendRequestData | BlockedAccountData) => ({
        accountId: data.accountId,
        displayName: displayNameCache.get(data.accountId) || data.accountId,
        nickname: 'alias' in data ? data.alias : undefined,
        avatarUrl: avatarCache.get(data.accountId) || '/misc/default-outfit-icon.png',
        createdAt: new Date(data.created)
      }))
      .toArray()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .filter((friend) => {
        if (!searchQuery) return true;

        const search = searchQuery.toLowerCase();
        return friend.displayName.toLowerCase().includes(search) || friend.accountId.toLowerCase().includes(search);
      }) || []
  );
</script>

{#if list?.length}
  <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl-plus:grid-cols-4 2xl:grid-cols-5">
    {#each list as friend (friend.accountId)}
      <FriendCard {friend} {listType} />
    {/each}
  </div>
{:else}
  <div class="flex flex-col items-center justify-center gap-1 p-4">
    <div class="mb-2 rounded-full bg-muted p-4">
      <BanIcon class="size-10 text-muted-foreground" />
    </div>

    <h3 class="text-xl font-medium">
      {#if listType === 'friends'}
        {$t('friendsManagement.noFriends')}
      {:else if listType === 'incoming'}
        {$t('friendsManagement.noIncomingRequests')}
      {:else if listType === 'outgoing'}
        {$t('friendsManagement.noOutgoingRequests')}
      {:else if listType === 'blocklist'}
        {$t('friendsManagement.noBlockedUsers')}
      {/if}
    </h3>
  </div>
{/if}
