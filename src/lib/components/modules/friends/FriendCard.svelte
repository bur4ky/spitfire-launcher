<script lang="ts">
  import * as DropdownMenu from '$components/ui/dropdown-menu';
  import type { Friend, ListType } from '$components/modules/friends/FriendsList.svelte';
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
  import { writeText } from '@tauri-apps/plugin-clipboard-manager';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import UserPlusIcon from '@lucide/svelte/icons/user-plus';
  import UserMinusIcon from '@lucide/svelte/icons/user-minus';
  import BanIcon from '@lucide/svelte/icons/ban';
  import ShieldMinus from '@lucide/svelte/icons/shield-minus';
  import { handleError } from '$lib/utils';
  import { t } from '$lib/i18n';
  import Friends from '$lib/modules/friends';
  import { accountStore } from '$lib/storage';

  type Props = {
    listType: ListType;
    friend: Friend;
  }

  const { listType, friend }: Props = $props();
  const activeAccount = accountStore.getActiveStore();

  let isAdding = $state(false);
  let isRemoving = $state(false);
  let isBlocking = $state(false);
  let isUnblocking = $state(false);

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
</script>

<div class="flex items-center justify-between p-4 rounded-md bg-accent text-accent-foreground">
  <div class="flex items-center gap-4">
    <img
      class="size-10 rounded-full"
      alt={friend.displayName}
      loading="lazy"
      src={friend.avatarUrl}
    />

    <div class="flex flex-col">
      <span class="font-medium break-all">{friend.displayName}</span>
      {#if friend.nickname}
        <span class="text-sm text-muted-foreground break-all">{friend.nickname}</span>
      {/if}
    </div>
  </div>

  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      <EllipsisIcon class="size-6 cursor-pointer"/>
    </DropdownMenu.Trigger>

    <DropdownMenu.Content>
      {@render CopyIdDropdownItem(friend.accountId)}

      {#if listType === 'friends'}
        {@render RemoveFriendDropdownItem(friend.accountId, 'friend')}
        {@render BlockDropdownItem(friend.accountId)}
      {:else if listType === 'incoming'}
        {@render AddFriendDropdownItem(friend.accountId)}
        {@render RemoveFriendDropdownItem(friend.accountId, 'incoming')}
        {@render BlockDropdownItem(friend.accountId)}
      {:else if listType === 'outgoing'}
        {@render RemoveFriendDropdownItem(friend.accountId, 'outgoing')}
        {@render BlockDropdownItem(friend.accountId)}
      {:else if listType === 'blocklist'}
        {@render UnblockDropdownItem(friend.accountId)}
      {/if}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>

{#snippet CopyIdDropdownItem(friendId: string)}
  <DropdownMenu.Item onclick={() => writeText(friendId)}>
    <CopyIcon class="size-5"/>
    {$t('friendsManagement.copyId')}
  </DropdownMenu.Item>
{/snippet}

{#snippet AddFriendDropdownItem(friendId: string)}
  <DropdownMenu.Item
    disabled={isAdding}
    onclick={() => acceptOrAddFriend(friendId)}
  >
    {#if isAdding}
      <LoaderCircleIcon class="size-5 animate-spin"/>
    {:else}
      <UserPlusIcon class="size-5"/>
    {/if}
    {$t('friendsManagement.acceptRequest')}
  </DropdownMenu.Item>
{/snippet}

{#snippet RemoveFriendDropdownItem(friendId: string, type: 'friend' | 'outgoing' | 'incoming')}
  <DropdownMenu.Item
    disabled={isRemoving}
    onclick={() => denyOrRemoveFriend(friendId)}
  >
    {#if isRemoving}
      <LoaderCircleIcon class="size-5 animate-spin"/>
    {:else}
      <UserMinusIcon class="size-5"/>
    {/if}
    {type === 'friend' ? $t('friendsManagement.removeFriend') : type === 'outgoing' ? $t('friendsManagement.cancelRequest') : $t('friendsManagement.denyRequest')}
  </DropdownMenu.Item>
{/snippet}

{#snippet BlockDropdownItem(accountId: string)}
  <DropdownMenu.Item
    disabled={isBlocking}
    onclick={() => blockUser(accountId)}
  >
    {#if isBlocking}
      <LoaderCircleIcon class="size-5 animate-spin"/>
    {:else}
      <BanIcon class="size-5"/>
    {/if}
    {$t('friendsManagement.blockUser')}
  </DropdownMenu.Item>
{/snippet}

{#snippet UnblockDropdownItem(accountId: string)}
  <DropdownMenu.Item
    disabled={isUnblocking}
    onclick={() => unblockUser(accountId)}
  >
    {#if isUnblocking}
      <LoaderCircleIcon class="size-5 animate-spin"/>
    {:else}
      <ShieldMinus class="size-5"/>
    {/if}
    {$t('friendsManagement.unblockUser')}
  </DropdownMenu.Item>
{/snippet}
