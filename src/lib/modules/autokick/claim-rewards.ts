import MCP from '$lib/modules/mcp';
import { sleep } from '$lib/utils';
import type { AccountData } from '$types/account';
import type { CampaignProfile } from '$types/game/mcp';
import { settingsStore } from '$lib/storage';

export default async function claimRewards(account: AccountData, skipDelay = false) {
  const delaySeconds = settingsStore.get().app?.claimRewardsDelay;
  if (!skipDelay && delaySeconds) {
    await sleep(delaySeconds * 1000);
  }

  const queryProfile = await MCP.queryProfile(account, 'campaign');
  const profile = queryProfile.profileChanges[0].profile;
  const attributes = profile.stats.attributes;

  const hasMissionAlertRewards = !!attributes.mission_alert_redemption_record?.pendingMissionAlertRewards?.items?.length;
  const hasDifficultyIncreaseRewards = !!attributes.difficulty_increase_rewards_record?.pendingRewards?.length;

  return Promise.allSettled([
    claimQuestRewards(account, profile.items),
    openCardPacks(account, profile.items),
    MCP.compose(account, 'RedeemSTWAccoladeTokens', 'athena', {}),
    hasMissionAlertRewards && MCP.compose(account, 'ClaimMissionAlertRewards', 'campaign', {}),
    hasDifficultyIncreaseRewards && MCP.compose(account, 'ClaimDifficultyIncreaseRewards', 'campaign', {})
  ]);
}

async function openCardPacks(account: AccountData, queryProfileItems: CampaignProfile['items']) {
  const cardPackItemIds = Object.entries(queryProfileItems)
    .filter(([, item]) => item.templateId.startsWith('CardPack:') && (item.attributes.match_statistics || item.attributes.pack_source === 'ItemCache'))
    .map(([id]) => id);

  if (!cardPackItemIds.length) return;

  return MCP.compose(account, 'OpenCardPackBatch', 'campaign', { cardPackItemIds });
}

async function claimQuestRewards(account: AccountData, queryProfileItems: CampaignProfile['items']) {
  const questIds = Object.entries(queryProfileItems)
    .filter(([, item]) => item.templateId.startsWith('Quest:') && item.attributes.quest_state === 'Completed')
    .map(([id]) => id);

  if (!questIds.length) return;

  return Promise.allSettled(
    questIds.map((id) =>
      MCP.compose(account, 'ClaimQuestReward', 'campaign', { questId: id, selectedRewardIndex: 0 })
    )
  );
}
