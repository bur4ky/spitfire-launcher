import {
  ingredients,
  RarityNames,
  RarityTypes,
  resources,
  survivors,
  survivorsMythicLeads,
  traps
} from '$lib/constants/stw/resources';
import {
  GroupZones,
  Theaters,
  ZoneModifiers,
  TheaterPowerLevels,
  TheaterStormKingZones,
  ZoneCategories
} from '$lib/constants/stw/world-info';
import { Authentication } from '$lib/modules/authentication';
import { baseGameService } from '$lib/services/epic';
import { worldInfoCache } from '$lib/stores';
import type { ParsedModifierData, ParsedResourceData, RarityType } from '$types/game/stw/resources';
import type {
  ParsedWorldInfo,
  WorldInfoData,
  WorldInfoMission,
  WorldInfoMissionAlert,
  WorldInfoTheater,
  WorldParsedMission
} from '$types/game/stw/world-info';
import { get } from 'svelte/store';

type Theater = keyof typeof Theaters;

type RewardItem = {
  itemType: string;
  quantity: number;
  attributes?: unknown;
};

export class WorldInfo {
  static async setCache() {
    worldInfoCache.set(WorldInfo.parse(await WorldInfo.get()));
  }

  static async get(accessToken?: string) {
    const token = accessToken || (await Authentication.getAccessTokenUsingClientCredentials()).access_token;

    return baseGameService
      .get<WorldInfoData>('world/info', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .json();
  }

  static parse(data: WorldInfoData): ParsedWorldInfo {
    const worldInfo = new Map<Theater, Map<string, WorldParsedMission>>();
    const validTheaters: string[] = [
      Theaters.Stonewood,
      Theaters.Plankerton,
      Theaters.CannyValley,
      Theaters.TwinePeaks
    ];

    for (const theater of data.theaters) {
      const theaterId = theater.uniqueId as Theater;
      if (!validTheaters.includes(theaterId) && theater.missionRewardNamedWeightsRowName !== 'Theater.Phoenix') {
        continue;
      }

      const theaterMissions = data.missions.find((x) => x.theaterId === theaterId && x.availableMissions?.length);
      if (!theaterMissions) continue;

      const theaterAlerts = data.missionAlerts.find(
        (x) => x.theaterId === theaterId && x.availableMissionAlerts?.length
      );

      const missions = new Map<string, WorldParsedMission>();

      for (const mission of theaterMissions.availableMissions) {
        const region = theater.regions.find((region) => {
          if (region.uniqueId === 'mission' || region.uniqueId === 'outpost') return false;

          const raw = region.missionData?.difficultyWeights?.[0]?.difficultyInfo?.rowName;
          if (!raw) return false;

          return region.tileIndices.includes(mission.tileIndex);
        });

        if (!region) continue;

        const raw = region.missionData!.difficultyWeights![0]!.difficultyInfo!.rowName!;
        let zone = raw.replace('Theater_', '').replace('_Group', '');
        if (zone === TheaterStormKingZones[Theaters.CannyValley]) {
          zone = 'Hard_Zone5';
        } else if (zone === TheaterStormKingZones[Theaters.TwinePeaks]) {
          zone = 'Endgame_Zone5';
        }

        const alert = theaterAlerts?.availableMissionAlerts.find((a) => a.tileIndex === mission.tileIndex);
        missions.set(mission.missionGuid, WorldInfo.parseMission(theater, mission, zone, alert));
      }

      worldInfo.set(
        theaterId,
        new Map(
          missions
            .entries()
            .toArray()
            .sort((entryA, entryB) => {
              const a = entryA[1];
              const b = entryB[1];

              return (
                b.powerLevel - a.powerLevel ||
                Number(b.generator.includes('group')) - Number(a.generator.includes('group')) ||
                Number(!!b.alert) - Number(!!a.alert)
              );
            })
        )
      );
    }

    return worldInfo;
  }

  private static parseMission(
    theater: WorldInfoTheater,
    mission: WorldInfoMission['availableMissions'][number],
    zone: string,
    alert?: WorldInfoMissionAlert['availableMissionAlerts'][number]
  ): WorldParsedMission {
    const zoneInfo = WorldInfo.parseZone(mission.missionGenerator);

    const powerLevel =
      TheaterPowerLevels[theater.uniqueId as keyof typeof TheaterPowerLevels]?.[zone as never] ??
      TheaterPowerLevels.Ventures?.[zone as never] ??
      -1;

    const rewardIds: string[] = [];
    const missionRewards = WorldInfo.mergeItems(mission.missionRewards.items).map((item) => {
      rewardIds.push(item.itemType);

      const parsed = WorldInfo.parseResource(item.itemType, item.quantity);
      const isHard =
        parsed.itemType.includes('reagent_c_t0') &&
        powerLevel === TheaterPowerLevels[Theaters.TwinePeaks].Endgame_Zone6 &&
        !parsed.itemType.endsWith('_veryhigh') &&
        !parsed.itemType.endsWith('_extreme');

      return {
        isHard,
        imageUrl: parsed.imageUrl,
        itemId: item.itemType,
        key: parsed.key,
        quantity: item.quantity ?? 1
      };
    });

    const alertRewards =
      alert &&
      WorldInfo.mergeItems(alert.missionAlertRewards.items).map((item) => {
        rewardIds.push(item.itemType);

        const parsed = WorldInfo.parseResource(item.itemType, item.quantity);
        return {
          imageUrl: parsed.imageUrl,
          itemId: item.itemType,
          quantity: item.quantity ?? 1,
          rarity: parsed.rarity,
          type: parsed.type
        };
      });

    const modifiers = alert?.missionAlertModifiers?.items.map((m) => WorldInfo.parseModifier(m.itemType)) ?? null;
    return {
      theaterId: theater.uniqueId,
      guid: mission.missionGuid,
      generator: mission.missionGenerator,
      tileIndex: mission.tileIndex,
      rewardIds,
      rewards: missionRewards,
      modifiers,
      powerLevel,
      zone: {
        theme: theater.tiles[mission.tileIndex].zoneTheme,
        type: zoneInfo
      },
      alert:
        alert && alertRewards?.length
          ? {
              guid: alert.missionAlertGuid,
              rewards: alertRewards
            }
          : null
    };
  }

  private static mergeItems(items: RewardItem[]) {
    const map = new Map<string, RewardItem>();

    for (const item of items) {
      const existing = map.get(item.itemType);
      if (existing) existing.quantity += item.quantity;
      else map.set(item.itemType, { ...item });
    }

    return map.values().toArray();
  }

  private static parseModifier(key: string): ParsedModifierData {
    const id = key.replace('GameplayModifier:', '');

    return {
      id: key,
      imageUrl: Object.values(ZoneModifiers).includes(id as any) ? `/modifiers/${id}.png` : '/world/question.png'
    };
  }

  private static parseZone(generator: string): ParsedModifierData {
    const entry = Object.entries(ZoneCategories).find(([, patterns]) => patterns.some((p) => generator.includes(p)));
    const key = entry?.[0] as keyof typeof ZoneCategories | undefined;
    const isGroup = generator.toLowerCase().includes('group');

    return {
      id: key ?? null,
      imageUrl: key
        ? isGroup && GroupZones.includes(key)
          ? `/world/${key}-group.png`
          : `/world/${key}.png`
        : '/world/quest.png'
    };
  }

  private static parseResource(key: string, quantity: number): ParsedResourceData {
    const newKey = key
      .replace(/_((very)?low|medium|(very)?high|extreme)$/i, '')
      .replace('AccountResource:', '')
      .replace('CardPack:zcp_', '');

    const rarity = WorldInfo.parseRarity(newKey);
    const rarityName = get(RarityNames)[rarity.rarity];
    const data: ParsedResourceData = {
      key,
      quantity,
      imageUrl: `/rarities/${rarity.rarity}.png`,
      itemType: key,
      name: rarity.type,
      rarity: rarity.rarity,
      type: null
    };

    for (const [id, resource] of Object.entries(resources)) {
      if (!newKey.includes(id)) continue;

      const isEventCurrency =
        (newKey !== 'eventcurrency_scaling' &&
          newKey !== 'eventcurrency_founders' &&
          newKey.startsWith('eventcurrency_')) ||
        newKey === 'campaign_event_currency';

      const isUnknown =
        id === 'campaign_event_currency' || id === 'eventcurrency_spring' || id === 'eventcurrency_summer';
      data.imageUrl = `${isEventCurrency ? '/currency' : '/resources'}/${id}.${isUnknown ? 'gif' : 'png'}`;
      data.name = resource.name;
      data.type = 'resource';

      return data;
    }

    for (const [id, ingredient] of Object.entries(ingredients)) {
      if (!newKey.includes(id)) continue;

      data.imageUrl = `/ingredients/${id}.png`;
      data.name = ingredient.name;
      data.type = 'ingredient';

      return data;
    }

    for (const id of Object.keys(survivorsMythicLeads)) {
      if (!newKey.includes(id)) continue;

      data.imageUrl = `/survivors/unique-leads/${id}.png`;
      data.name = `${get(RarityNames)[RarityTypes.Mythic]} Lead`;
      data.type = 'worker';

      return data;
    }

    for (const [id, survivor] of Object.entries(survivors)) {
      if (!newKey.includes(id)) continue;

      data.imageUrl = `/survivors/${id}.png`;
      data.name = survivor.name || `${rarityName} Survivor`;
      data.type = 'worker';

      return data;
    }

    if (newKey.startsWith('Worker:')) {
      const isManager = newKey.includes('manager');

      data.imageUrl = `/resources/voucher_generic_${isManager ? 'manager' : 'worker'}_${rarity.rarity}.png`;
      data.name = `${rarityName} Survivor`;
      data.type = 'worker';

      return data;
    }

    if (newKey.startsWith('Hero:')) {
      data.imageUrl = `/resources/voucher_generic_hero_${rarity.rarity}.png`;

      data.name = `${rarityName} Hero`;
      data.type = 'hero';

      return data;
    }

    if (newKey.startsWith('Defender:')) {
      data.imageUrl = `/resources/voucher_generic_defender_${rarity.rarity}.png`;

      data.name = `${rarityName} Defender`;
      data.type = 'defender';

      return data;
    }

    for (const [id, trap] of Object.entries(traps)) {
      if (!newKey.includes(id)) continue;

      data.imageUrl = `/traps/${id}.png`;
      data.name = `${rarityName} ${trap.name}`;
      data.type = 'trap';

      return data;
    }

    if (newKey.startsWith('Schematic:')) {
      data.imageUrl = `/resources/voucher_generic_schematic_${rarity.rarity}.png`;
      data.name = `${rarityName} Schematic`;

      return data;
    }

    return data;
  }

  private static parseRarity(key: string) {
    let rarity: RarityType = RarityTypes.Common;

    for (const r of Object.values(RarityTypes)) {
      if (key.includes(`_${r}`)) {
        rarity = r;
        break;
      }
    }

    return {
      type: key.split(':')[0],
      name: get(RarityNames)[rarity],
      rarity
    };
  }
}
