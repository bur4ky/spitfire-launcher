<script lang="ts">
  import type { Friend, ListType } from '$components/modules/friends/FriendsList.svelte';
  import * as DropdownMenu from '$components/ui/dropdown-menu';
  import { t } from '$lib/i18n';
  import { Friends } from '$lib/modules/friends';
  import { XMPPManager, type FriendPresence } from '$lib/modules/xmpp';
  import { accountStore } from '$lib/storage';
  import { handleError } from '$lib/utils';
  import BanIcon from '@lucide/svelte/icons/ban';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import ShieldMinus from '@lucide/svelte/icons/shield-minus';
  import UserMinusIcon from '@lucide/svelte/icons/user-minus';
  import UserPlusIcon from '@lucide/svelte/icons/user-plus';
  import { writeText } from '@tauri-apps/plugin-clipboard-manager';
  import { onMount } from 'svelte';

  type Props = {
    listType: ListType;
    friend: Friend;
  };

  const { listType, friend }: Props = $props();
  const activeAccount = accountStore.getActiveStore();

  const statusColors: Record<FriendPresence['type'], string> = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-500'
  };

  let isAdding = $state(false);
  let isRemoving = $state(false);
  let isBlocking = $state(false);
  let isUnblocking = $state(false);
  let presence = $state<FriendPresence>();
  let xmpp = $state<XMPPManager>();

  async function acceptOrAddFriend(id: string) {
    isAdding = true;

    try {
      await Friends.addFriend($activeAccount, id);
    } catch (error) {
      handleError({ error, message: $t('friendsManagement.failedToAdd'), account: $activeAccount });
    } finally {
      isAdding = false;
    }
  }

  async function denyOrRemoveFriend(id: string) {
    isRemoving = true;

    try {
      await Friends.removeFriend($activeAccount, id);
    } catch (error) {
      handleError({ error, message: $t('friendsManagement.failedToRemove'), account: $activeAccount });
    } finally {
      isRemoving = false;
    }
  }

  async function blockUser(id: string) {
    isBlocking = true;

    try {
      await Friends.block($activeAccount, id);
    } catch (error) {
      handleError({ error, message: $t('friendsManagement.failedToBlock'), account: $activeAccount });
    } finally {
      isBlocking = false;
    }
  }

  async function unblockUser(id: string) {
    isUnblocking = true;

    try {
      await Friends.unblock($activeAccount, id);
    } catch (error) {
      handleError({ error, message: $t('friendsManagement.failedToUnblock'), account: $activeAccount });
    } finally {
      isUnblocking = false;
    }
  }

  $effect(() => {
    if (xmpp) {
      presence = xmpp.presences.get(friend.accountId);
    }
  });

  onMount(async () => {
    if (listType === 'friends') {
      xmpp = await XMPPManager.new($activeAccount, 'friends');
    }
  });
</script>

<div class="group flex items-center rounded-md border bg-card px-3 py-2 text-card-foreground">
  <div class="flex items-center gap-2">
    <div class="relative shrink-0">
      <img class="size-8 rounded-full" alt={friend.displayName} loading="lazy" src={friend.avatarUrl} />

      {#if listType === 'friends'}
        <span
          class={[
            'absolute right-0 bottom-0 block size-3 rounded-full border-2 border-card',
            statusColors[presence?.type || 'offline']
          ]}
        ></span>
      {/if}
    </div>

    <div class="flex flex-col">
      <span class="text-sm font-medium break-all">{friend.displayName}</span>
      {#if presence?.status}
        <span class="line-clamp-2 text-xs break-all text-muted-foreground">{presence.status}</span>
      {/if}
    </div>
  </div>

  <DropdownMenu.Root>
    <DropdownMenu.Trigger class="ml-auto opacity-0 transition group-hover:opacity-100 data-[state=open]:opacity-100">
      <EllipsisIcon class="size-4.5 cursor-pointer text-muted-foreground" />
    </DropdownMenu.Trigger>

    <DropdownMenu.Content>
      {@render CopyIdDropdownItem()}

      {#if listType === 'friends'}
        {@render RemoveFriendDropdownItem('friend')}
        {@render BlockDropdownItem()}
      {:else if listType === 'incoming'}
        {@render AddFriendDropdownItem()}
        {@render RemoveFriendDropdownItem('incoming')}
        {@render BlockDropdownItem()}
      {:else if listType === 'outgoing'}
        {@render RemoveFriendDropdownItem('outgoing')}
        {@render BlockDropdownItem()}
      {:else if listType === 'blocklist'}
        {@render UnblockDropdownItem()}
      {/if}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>

{#snippet CopyIdDropdownItem()}
  <DropdownMenu.Item onclick={() => writeText(friend.accountId)}>
    <CopyIcon class="size-4.5" />
    {$t('friendsManagement.copyId')}
  </DropdownMenu.Item>
{/snippet}

{#snippet AddFriendDropdownItem()}
  <DropdownMenu.Item disabled={isAdding} onclick={() => acceptOrAddFriend(friend.accountId)}>
    {#if isAdding}
      <LoaderCircleIcon class="size-4.5 animate-spin" />
    {:else}
      <UserPlusIcon class="size-4.5" />
    {/if}

    {$t('friendsManagement.acceptRequest')}
  </DropdownMenu.Item>
{/snippet}

{#snippet RemoveFriendDropdownItem(type: 'friend' | 'outgoing' | 'incoming')}
  <DropdownMenu.Item disabled={isRemoving} onclick={() => denyOrRemoveFriend(friend.accountId)}>
    {#if isRemoving}
      <LoaderCircleIcon class="size-4.5 animate-spin" />
    {:else}
      <UserMinusIcon class="size-4.5" />
    {/if}

    {#if type === 'friend'}
      {$t('friendsManagement.removeFriend')}
    {:else if type === 'outgoing'}
      {$t('friendsManagement.cancelRequest')}
    {:else}
      {$t('friendsManagement.denyRequest')}
    {/if}
  </DropdownMenu.Item>
{/snippet}

{#snippet BlockDropdownItem()}
  <DropdownMenu.Item disabled={isBlocking} onclick={() => blockUser(friend.accountId)}>
    {#if isBlocking}
      <LoaderCircleIcon class="size-4.5 animate-spin" />
    {:else}
      <BanIcon class="size-4.5" />
    {/if}

    {$t('friendsManagement.blockUser')}
  </DropdownMenu.Item>
{/snippet}

{#snippet UnblockDropdownItem()}
  <DropdownMenu.Item disabled={isUnblocking} onclick={() => unblockUser(friend.accountId)}>
    {#if isUnblocking}
      <LoaderCircleIcon class="size-4.5 animate-spin" />
    {:else}
      <ShieldMinus class="size-4.5" />
    {/if}

    {$t('friendsManagement.unblockUser')}
  </DropdownMenu.Item>
{/snippet}
