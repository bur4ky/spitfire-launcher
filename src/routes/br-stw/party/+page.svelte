<script lang="ts" module>
  import { SvelteSet } from 'svelte/reactivity';

  let isKicking = $state(false);
  let isLeaving = $state(false);
  let isClaiming = $state(false);
  let isAddingFriend = $state(false);
  let isRemovingFriend = $state(false);

  let shouldClaimRewards = $state(false);
  let shouldTransferMaterials = $state(false);
  let shouldInvite = $state(false);

  let kickAllSelectedAccount = $state<string>('');
  let leavePartySelectedAccounts = $state<string[]>([]);
  let claimRewardsPartySelectedAccounts = $state<string[]>([]);

  let kickingMemberIds = new SvelteSet<string>();
  let promotingMemberId = $state<string>();
</script>

<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import MemberCard, { type PartyMember } from '$components/modules/party/MemberCard.svelte';
  import PartyAccountSelection from '$components/modules/party/PartyAccountSelection.svelte';
  import { Label } from '$components/ui/label';
  import { Switch } from '$components/ui/switch';
  import * as Tabs from '$components/ui/tabs';
  import { Friends } from '$lib/modules/friends';
  import { XMPPManager } from '$lib/modules/xmpp';
  import { Party } from '$lib/modules/party';
  import { AutoKickBase } from '$lib/modules/autokick/base';
  import { accountPartiesStore, friendsStore } from '$lib/stores';
  import { transferBuildingMaterials } from '$lib/modules/autokick/transfer-building-materials';
  import { claimRewards } from '$lib/modules/autokick/claim-rewards';
  import { handleError, sleep } from '$lib/utils';
  import { t } from '$lib/i18n';
  import { toast } from 'svelte-sonner';
  import type { AccountData } from '$types/account';
  import type { PartyData } from '$types/game/party';
  import { EpicEvents } from '$lib/constants/events';
  import { logger } from '$lib/logger';
  import { accountStore } from '$lib/storage';
  import { language } from '$lib/i18n';

  type PartySummary = {
    maxSize: number;
    region: string;
    createdAt: Date;
  };

  const allAccounts = $derived($accountStore.accounts);
  const activeAccount = accountStore.getActiveStore();
  const currentAccountParty = $derived(accountPartiesStore.get($activeAccount.accountId));
  const isDoingSomething = $derived(isKicking || isLeaving || isClaiming);

  const partyData = $derived<PartySummary | undefined>(
    currentAccountParty && {
      maxSize: currentAccountParty.config.max_size,
      region: currentAccountParty.meta['Default:RegionId_s'],
      createdAt: new Date(currentAccountParty.created_at)
    }
  );

  const partyMembers = $derived<PartyMember[] | undefined>(
    currentAccountParty?.members
      .map((member) => {
        const athenaCosmeticLoadout = parseJSON(member.meta['Default:AthenaCosmeticLoadout_j'])?.AthenaCosmeticLoadout;
        const packedState = parseJSON(member.meta['Default:PackedState_j']?.replaceAll('True', 'true'));
        const lobbyState = parseJSON(member.meta['Default:LobbyState_j']);
        const battlePass = parseJSON(member.meta['Default:BattlePassInfo_j']);

        return {
          accountId: member.account_id,
          displayName: member.meta['urn:epic:member:dn_s'] || '???',
          platformSpecificName: member.connections[0]?.meta['account_pl_dn'],
          avatarUrl: getSmallIcon(athenaCosmeticLoadout?.characterPrimaryAssetId, ':'),
          platform: member.connections[0]?.meta['urn:epic:conn:platform_s'],
          ownsSaveTheWorld: packedState?.PackedState?.hasPurchasedSTW || false,
          isReady: lobbyState?.LobbyState?.gameReadiness === 'Ready',
          isLeader: member.role === 'CAPTAIN',
          battlePassLevel: battlePass?.BattlePassInfo?.passLevel || 1,
          crownedWins:
            athenaCosmeticLoadout?.cosmeticStats?.find((x: any) => x.statName === 'TotalRoyalRoyales')?.value || 0,
          joinedAt: new Date(member.joined_at),
          loadout: [
            {
              type: 'outfit',
              icon: getSmallIcon(athenaCosmeticLoadout?.characterPrimaryAssetId, ':')
            },
            { type: 'backpack', icon: getSmallIcon(athenaCosmeticLoadout?.backpackDef) },
            { type: 'pickaxe', icon: getSmallIcon(athenaCosmeticLoadout?.pickaxeDef) },
            { type: 'contrail', icon: getSmallIcon(athenaCosmeticLoadout?.contrailDef) }
          ].filter((x) => x.icon)
        };
      })
      .sort((a, b) => {
        if (a.isLeader !== b.isLeader) return a.isLeader ? -1 : 1;
        return b.joinedAt.getTime() - a.joinedAt.getTime();
      })
  );

  const partyLeaderAccount = $derived(
    allAccounts.find((a) => partyMembers?.some((m) => m.accountId === a.accountId && m.isLeader))
  );

  async function fetchPartyData(account: AccountData) {
    const cache = accountPartiesStore.get(account.accountId);
    if (cache) return cache;

    const response = await Party.get(account);
    return response?.current[0];
  }

  async function kickAll() {
    if (!kickAllSelectedAccount) return;

    const kickerAccount = allAccounts.find((account) => account.accountId === kickAllSelectedAccount);
    if (!kickerAccount) return;

    isKicking = true;

    try {
      const party = await fetchPartyData(kickerAccount);
      if (!party) {
        toast.error($t('partyManagement.stwActions.notInParty'));
        return;
      }

      const leader = party.members.find((x) => x.role === 'CAPTAIN');
      if (!leader || leader.account_id !== kickerAccount.accountId) {
        toast.error($t('partyManagement.stwActions.notLeader'));
        return;
      }

      const memberIds = party.members.map((x) => x.account_id).filter((id) => id !== kickerAccount.accountId);
      await Promise.allSettled(memberIds.map((id) => kickMember(party.id, id, kickerAccount)));

      await Party.leave(kickerAccount, party.id);
      afterKickActions(kickerAccount.accountId);

      toast.success($t('partyManagement.stwActions.kickedAll'));

      if (shouldInvite) {
        inviteMembers(
          kickerAccount,
          party.members.filter((x) => x.account_id !== kickerAccount.accountId)
        ).catch((error) => {
          logger.error('Failed to invite members back after kicking them', { error });
        });
      }
    } catch (error) {
      handleError({
        error,
        message: $t('partyManagement.stwActions.failedToKickAll'),
        account: kickerAccount
      });
    } finally {
      isKicking = false;
    }
  }

  async function kickMember(partyId: string, memberId: string, kickerAccount?: AccountData) {
    const kicker = kickerAccount ?? partyLeaderAccount;
    if (!kicker) return;

    kickingMemberIds.add(memberId);

    try {
      await Party.kick(kicker, partyId, memberId);
      afterKickActions(memberId);
    } catch (error) {
      handleError({
        error,
        message: $t('partyManagement.stwActions.failedToKickMember'),
        account: kicker
      });
    } finally {
      kickingMemberIds.delete(memberId);
    }
  }

  async function leaveParty(claimOnly = false, accountId?: string) {
    const selectedAccounts = accountId
      ? [accountId]
      : claimOnly
        ? claimRewardsPartySelectedAccounts
        : leavePartySelectedAccounts;

    if (!selectedAccounts?.length) return;

    if (claimOnly) {
      isClaiming = true;
    } else {
      isLeaving = true;
    }

    try {
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
      const accountParties = new Map<string, string>();
      const accounts = allAccounts.filter((a) => selectedAccounts.includes(a.accountId));
      const registeredIds = allAccounts.map((a) => a.accountId);

      for (const account of accounts) {
        if (accountParties.has(account.accountId)) continue;

        const party = await fetchPartyData(account);
        if (!party) continue;

        for (const member of party.members) {
          if (registeredIds.includes(member.account_id)) {
            accountParties.set(member.account_id, party.id);
            accountPartiesStore.set(member.account_id, party);
          }
        }
      }

      await Promise.allSettled(
        accountParties
          .entries()
          .toArray()
          .map(async ([id, partyId]) => {
            const account = allAccounts.find((a) => a.accountId === id)!;

            if (!claimOnly) {
              const oldParty = accountPartiesStore.get(account.accountId);
              const oldMembers = oldParty?.members.filter((x) => x.account_id !== account.accountId) || [];
              await Party.leave(account, partyId);

              if (shouldInvite && !claimOnly) {
                fetchPartyData(account).then((party) => {
                  if (party) {
                    inviteMembers(account, oldMembers).catch((error) => {
                      logger.error('Failed to invite members back after leaving party', { error });
                    });
                  }
                });
              }
            }

            afterKickActions(id, claimOnly);
          })
      );

      toast.success(
        accountId
          ? $t('partyManagement.stwActions.leftParty')
          : claimOnly
            ? $t('partyManagement.stwActions.claimedRewards')
            : $t('partyManagement.stwActions.leftParties')
      );
    } catch (error) {
      handleError({
        error,
        message: claimOnly
          ? $t('partyManagement.stwActions.failedToClaimRewards')
          : $t('partyManagement.stwActions.failedToLeaveParties')
      });
    } finally {
      if (claimOnly) {
        isClaiming = false;
      } else {
        isLeaving = false;
      }
    }
  }

  async function inviteMembers(account: AccountData, members: PartyData['members']) {
    if (!members?.length) return;

    const xmpp = await XMPPManager.new(account, 'partyManagement');
    await xmpp.waitForEvent(EpicEvents.MemberJoined, (data) => data.account_id === account.accountId, 20000);
    await sleep(10_000);

    const [partyRes, friendsRes] = await Promise.allSettled([Party.get(account), Friends.getFriends(account)]);

    const party = partyRes.status === 'fulfilled' ? partyRes.value.current[0] : null;
    if (!party || friendsRes.status === 'rejected' || friendsRes.value.length) return;

    const memberIds = members.map((x) => x.account_id).filter((x) => x !== account.accountId);
    const friendsInParty = friendsRes.value.filter((friend) => memberIds.includes(friend.accountId));

    await Promise.allSettled(friendsInParty.map((friend) => Party.invite(account, party.id, friend.accountId)));
  }

  async function afterKickActions(memberId: string, claim = false) {
    const account = allAccounts.find((a) => a.accountId === memberId);
    if (!account) return;

    const settings = AutoKickBase.accounts.get(memberId)?.settings || {};
    const promises: Promise<unknown>[] = [];

    if (!settings.autoClaim && (claim || shouldClaimRewards)) {
      promises.push(claimRewards(account, true));
    }

    if (!settings.autoTransferMaterials && shouldTransferMaterials) {
      promises.push(transferBuildingMaterials(account, true));
    }

    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === 'rejected') {
        logger.error('Failed to perform post-kick action', {
          accountId: account.accountId,
          error: result.reason
        });
      }
    }
  }

  async function promote(memberId: string) {
    promotingMemberId = memberId;

    try {
      const member = partyMembers?.find((m) => m.accountId === memberId);
      if (!member || !partyLeaderAccount || !currentAccountParty) return;

      await Party.promote(partyLeaderAccount, currentAccountParty.id, memberId);
      toast.success($t('partyManagement.stwActions.promotedMember', { name: member.displayName }));
    } catch (error) {
      handleError({
        error,
        message: $t('partyManagement.stwActions.failedToPromoteMember'),
        account: $activeAccount
      });
    } finally {
      promotingMemberId = undefined;
    }
  }

  async function sendFriendRequest(memberId: string) {
    isAddingFriend = true;

    try {
      await Friends.addFriend($activeAccount, memberId);
    } catch (error) {
      handleError({
        error,
        message: $t('partyManagement.partyMembers.failedToSendFriendRequest'),
        account: $activeAccount
      });
    } finally {
      isAddingFriend = false;
    }
  }

  async function removeFriend(memberId: string) {
    isRemovingFriend = true;

    try {
      await Friends.removeFriend($activeAccount, memberId);
    } catch (error) {
      handleError({
        error,
        message: $t('partyManagement.partyMembers.failedToRemoveFriend'),
        account: $activeAccount
      });
    } finally {
      isRemovingFriend = false;
    }
  }

  function parseJSON(value?: string) {
    try {
      return value ? JSON.parse(value) : {};
    } catch {
      return {};
    }
  }

  function getSmallIcon(id?: string, splitWith = '.') {
    return id ? `https://fortnite-api.com/images/cosmetics/br/${id.split(splitWith)[1]}/smallicon.png` : '';
  }

  $effect(() => {
    fetchPartyData($activeAccount);
    XMPPManager.new($activeAccount, 'partyManagement').then((xmpp) => {
      xmpp.connect();
    });

    if (!friendsStore.has($activeAccount.accountId)) {
      Friends.getSummary($activeAccount);
    }
  });
</script>

<PageContent class="mt-2" title={$t('partyManagement.page.title')}>
  <Tabs.Root value="stwActions">
    <Tabs.List class="mb-2">
      <Tabs.Trigger value="stwActions">
        {$t('partyManagement.tabs.stwActions')}
      </Tabs.Trigger>
      <Tabs.Trigger disabled={!partyData && !partyMembers?.length} value="partyMembers">
        {$t('partyManagement.tabs.partyMembers')}
      </Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="stwActions">
      {@render STWActions()}
    </Tabs.Content>

    <Tabs.Content value="partyMembers">
      {@render PartyMembers()}
    </Tabs.Content>
  </Tabs.Root>
</PageContent>

{#snippet STWActions()}
  <div class="flex flex-col gap-2">
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <Switch id="shouldClaimRewards" bind:checked={shouldClaimRewards} />
        <Label for="shouldClaimRewards">{$t('partyManagement.stwActions.claimRewardsAfterLeaving')}</Label>
      </div>

      <div class="flex items-center gap-2">
        <Switch id="shouldTransferMaterials" bind:checked={shouldTransferMaterials} />
        <Label for="shouldTransferMaterials">{$t('partyManagement.stwActions.transferMaterialsAfterLeaving')}</Label>
      </div>

      <div class="flex items-center gap-2">
        <Switch id="inviteAfterLeaving" bind:checked={shouldInvite} />
        <Label for="inviteAfterLeaving">{$t('partyManagement.stwActions.inviteAfterLeaving')}</Label>
      </div>
    </div>

    <div class="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <PartyAccountSelection
        disabled={isDoingSomething || !kickAllSelectedAccount}
        loading={isKicking}
        onclick={kickAll}
        type="single"
        bind:value={kickAllSelectedAccount}
      >
        {$t('partyManagement.stwActions.kickAll')}
      </PartyAccountSelection>

      <PartyAccountSelection
        disabled={isDoingSomething || !leavePartySelectedAccounts.length}
        loading={isLeaving}
        onclick={() => leaveParty()}
        type="multiple"
        bind:value={leavePartySelectedAccounts}
      >
        {$t('partyManagement.stwActions.leaveParty')}
      </PartyAccountSelection>

      <PartyAccountSelection
        disabled={isDoingSomething || !claimRewardsPartySelectedAccounts.length}
        loading={isClaiming}
        onclick={() => leaveParty(true)}
        type="multiple"
        bind:value={claimRewardsPartySelectedAccounts}
      >
        {$t('partyManagement.stwActions.claimRewards')}
      </PartyAccountSelection>
    </div>
  </div>
{/snippet}

{#snippet PartyMembers()}
  <div class="space-y-4">
    {#if partyData}
      <div>
        <div class="flex items-center gap-1">
          <span class="text-muted-foreground">{$t('partyManagement.partyMembers.size')}:</span>
          <span>{partyMembers?.length || 0}/{partyData.maxSize}</span>
        </div>

        <div class="flex items-center gap-1">
          <span class="text-muted-foreground">{$t('partyManagement.partyMembers.region')}:</span>
          <span>{partyData.region}</span>
        </div>

        <div class="flex items-center gap-1">
          <span class="text-muted-foreground">{$t('partyManagement.partyMembers.createdAt')}:</span>
          <span>{partyData.createdAt.toLocaleString($language)}</span>
        </div>
      </div>
    {/if}

    {#if partyMembers}
      <div class="grid gap-4 max-[40rem]:place-items-center min-[40rem]:grid-cols-2 min-[75rem]:grid-cols-3">
        {#each partyMembers as member (member.accountId)}
          {@const isRegisteredAccount = allAccounts.some((account) => account.accountId === member.accountId)}
          {@const canLeave = isRegisteredAccount && !member.isLeader}
          {@const canKick = partyLeaderAccount ? partyLeaderAccount.accountId !== member.accountId : false}
          {@const canBePromoted = partyLeaderAccount ? !member.isLeader : false}
          {@const accountFriends = friendsStore.get($activeAccount.accountId)}
          {@const canAddFriend =
            !accountFriends?.friends?.has(member.accountId) && !accountFriends?.outgoing?.has(member.accountId)}

          <!-- Maybe this wasn't a good idea -->
          <MemberCard
            {canAddFriend}
            {canBePromoted}
            {canKick}
            {canLeave}
            {isAddingFriend}
            {isLeaving}
            {isRemovingFriend}
            {kickMember}
            {kickingMemberIds}
            {leaveParty}
            {member}
            {promote}
            {promotingMemberId}
            {removeFriend}
            {sendFriendRequest}
          />
        {/each}
      </div>
    {/if}
  </div>
{/snippet}
