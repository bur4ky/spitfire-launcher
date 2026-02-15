import { MCP } from '$lib/modules/mcp';
import { settingsStore } from '$lib/storage';
import { sleep } from '$lib/utils';
import type { AccountData } from '$types/account';

type MCPStorageTransferItem = {
  itemId: string;
  quantity: number;
  toStorage: boolean;
  newItemIdHint: string;
};

type BuildingMaterialData = {
  total: number;
  items: MCPStorageTransferItem[];
};

const MAX_BUILDING_MATERIALS = 5000;

export async function transferBuildingMaterials(account: AccountData, skipDelay = false) {
  if (!skipDelay) {
    const delaySeconds = settingsStore.get().app?.claimRewardsDelay;
    await sleep((delaySeconds || 1.5) * 1000);
  }

  const materials: Record<string, BuildingMaterialData> = {
    'WorldItem:wooditemdata': { total: 0, items: [] },
    'WorldItem:stoneitemdata': { total: 0, items: [] },
    'WorldItem:metalitemdata': { total: 0, items: [] }
  };

  const storageProfile = await MCP.queryProfile(account, 'outpost0');
  const profile = storageProfile.profileChanges[0].profile;
  const materialIds = Object.keys(materials);
  const ownedMaterials = Object.entries(profile.items).filter(([, item]) => materialIds.includes(item.templateId));
  if (!ownedMaterials.length) return;

  for (const [itemId, itemData] of ownedMaterials) {
    const buildingMaterial = materials[itemData.templateId];
    const quantity = Math.min(itemData.quantity, MAX_BUILDING_MATERIALS - buildingMaterial.total);

    buildingMaterial.total += quantity;
    buildingMaterial.items.push({
      itemId,
      quantity,
      newItemIdHint: '',
      toStorage: false
    });
  }

  return MCP.compose(account, 'StorageTransfer', 'theater0', {
    transferOperations: Object.values(materials)
      .flatMap((material) => material.items)
      .filter((x) => x.quantity > 0)
  });
}
