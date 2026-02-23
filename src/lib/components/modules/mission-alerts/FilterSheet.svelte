<script lang="ts" module>
  type Filters = {
    zones: Set<string>;
    missionTypes: Set<string>;
    rarities: Set<string>;
    rewards: Set<string>;
    group: boolean;
  };

  export const filters = writable<Filters>(getDefaults());

  function getDefaults() {
    return {
      zones: new Set<string>(),
      missionTypes: new Set<string>(),
      rarities: new Set<string>(),
      rewards: new Set<string>(),
      group: false
    };
  }
</script>

<script lang="ts">
  import * as Sheet from '$components/ui/sheet';
  import { Button } from '$components/ui/button';
  import { Toggle } from '$components/ui/toggle';
  import { writable } from 'svelte/store';
  import { TheaterColors, TheaterLetters, Theaters } from '$lib/constants/stw/world-info';
  import { RarityTypes } from '$lib/constants/stw/resources';
  import { Label } from '$components/ui/label';
  import { Switch } from '$components/ui/switch';
  import { t } from '$lib/i18n';

  type Props = {
    open?: boolean;
  };

  let { open = $bindable(false) }: Props = $props();

  type Filter<E extends Record<string, any>> = {
    label: string;
    value: string;
  } & E;

  const zoneFilters: Filter<{ color: string }>[] = [
    {
      label: TheaterLetters[Theaters.Stonewood],
      value: Theaters.Stonewood,
      color: TheaterColors[Theaters.Stonewood]
    },
    {
      label: TheaterLetters[Theaters.Plankerton],
      value: Theaters.Plankerton,
      color: TheaterColors[Theaters.Plankerton]
    },
    {
      label: TheaterLetters[Theaters.CannyValley],
      value: Theaters.CannyValley,
      color: TheaterColors[Theaters.CannyValley]
    },
    {
      label: TheaterLetters[Theaters.TwinePeaks],
      value: Theaters.TwinePeaks,
      color: TheaterColors[Theaters.TwinePeaks]
    },
    {
      label: TheaterLetters.Ventures,
      value: 'ventures',
      color: TheaterColors.Ventures
    }
  ];

  const missionTypeFilters: Filter<{ icon: string }>[] = [
    {
      label: 'Atlas',
      value: 'atlas',
      icon: '/world/atlas.png'
    },
    {
      label: 'Atlas',
      value: 'atlas-c2',
      icon: '/world/atlas-c2.png'
    },
    {
      label: 'Atlas',
      value: 'atlas-c3',
      icon: '/world/atlas-c3.png'
    },
    {
      label: 'Atlas',
      value: 'atlas-c4',
      icon: '/world/atlas-c4.png'
    },
    {
      label: 'Deliver The Bomb',
      value: 'dtb',
      icon: '/world/dtb.png'
    },
    {
      label: 'Destroy The Encampments',
      value: 'dte',
      icon: '/world/dte.png'
    },
    {
      label: 'Eliminate And Collect',
      value: 'eac',
      icon: '/world/eac.png'
    },
    {
      label: 'Evacuate The Shelter',
      value: 'ets',
      icon: '/world/ets.png'
    },
    {
      label: 'Build The Radar Grid',
      value: 'radar',
      icon: '/world/radar.png'
    },
    {
      label: 'Refuel The Homebase',
      value: 'refuel',
      icon: '/world/refuel.png'
    },
    {
      label: 'Rescue The Survivors',
      value: 'rescue',
      icon: '/world/rescue.png'
    },
    {
      label: 'Resupply',
      value: 'resupply',
      icon: '/world/resupply.png'
    },
    {
      label: 'Retrieve The Data',
      value: 'rtd',
      icon: '/world/rtd.png'
    },
    {
      label: 'Ride The Lightning',
      value: 'rtl',
      icon: '/world/rtl.png'
    },
    {
      label: 'Repair The Shelter',
      value: 'rts',
      icon: '/world/rts.png'
    },
    {
      label: 'Hunt The Titan',
      value: 'htm',
      icon: '/world/htm.png'
    }
  ];

  const rarityFilters: Filter<{ icon: string }>[] = [
    {
      label: 'Common',
      value: RarityTypes.Common,
      icon: `/rarities/${RarityTypes.Common}.png`
    },
    {
      label: 'Uncommon',
      value: RarityTypes.Uncommon,
      icon: `/rarities/${RarityTypes.Uncommon}.png`
    },
    {
      label: 'Rare',
      value: RarityTypes.Rare,
      icon: `/rarities/${RarityTypes.Rare}.png`
    },
    {
      label: 'Epic',
      value: RarityTypes.Epic,
      icon: `/rarities/${RarityTypes.Epic}.png`
    },
    {
      label: 'Legendary',
      value: RarityTypes.Legendary,
      icon: `/rarities/${RarityTypes.Legendary}.png`
    }
  ];

  const rewardFilters: Filter<{ icon: string }>[] = [
    {
      label: 'V-Bucks',
      value: 'currency_mtxswap',
      icon: '/resources/currency_mtxswap.png'
    },
    {
      label: 'Survivors',
      value: 'Worker',
      icon: '/resources/voucher_generic_worker.png'
    },
    {
      label: 'Lead Survivors',
      value: 'Manager',
      icon: '/resources/voucher_generic_manager.png'
    },
    {
      label: 'Defenders',
      value: 'Defender',
      icon: '/resources/voucher_generic_defender.png'
    },
    {
      label: 'Heroes',
      value: 'Hero',
      icon: '/resources/voucher_generic_hero.png'
    },
    {
      label: 'Ranged Weapons',
      value: 'Ranged',
      icon: '/resources/voucher_generic_ranged.png'
    },
    {
      label: 'Melee Weapons',
      value: 'Melee',
      icon: '/resources/voucher_generic_melee.png'
    },
    {
      label: 'Traps',
      value: 'Trap',
      icon: '/resources/voucher_generic_trap.png'
    },
    {
      label: 'Upgrade Llama',
      value: 'voucher_cardpack_bronze',
      icon: '/resources/voucher_cardpack_bronze.png'
    },
    {
      label: 'Mini Llama',
      value: 'voucher_basicpack',
      icon: '/resources/voucher_basicpack.png'
    },
    {
      label: 'Pure Drop Of Rain',
      value: 'reagent_c_t01',
      icon: '/resources/reagent_c_t01.png'
    },
    {
      label: 'Lightning In A Bottle',
      value: 'reagent_c_t02',
      icon: '/resources/reagent_c_t02.png'
    },
    {
      label: 'Eye Of The Storm',
      value: 'reagent_c_t03',
      icon: '/resources/reagent_c_t03.png'
    },
    {
      label: 'Storm Shard',
      value: 'reagent_c_t04',
      icon: '/resources/reagent_c_t04.png'
    },
    {
      label: 'Hero XP',
      value: 'heroxp',
      icon: '/resources/heroxp.png'
    },
    {
      label: 'Schematic XP',
      value: 'schematicxp',
      icon: '/resources/schematicxp.png'
    },
    {
      label: 'Survivor XP',
      value: 'personnelxp',
      icon: '/resources/personnelxp.png'
    },
    {
      label: 'Legendary Perk Up',
      value: 'reagent_alteration_upgrade_sr',
      icon: '/resources/reagent_alteration_upgrade_sr.png'
    },
    {
      label: 'Epic Perk Up',
      value: 'reagent_alteration_upgrade_vr',
      icon: '/resources/reagent_alteration_upgrade_vr.png'
    },
    {
      label: 'Rare Perk Up',
      value: 'reagent_alteration_upgrade_r',
      icon: '/resources/reagent_alteration_upgrade_r.png'
    },
    {
      label: 'Uncommon Perk Up',
      value: 'reagent_alteration_upgrade_uc',
      icon: '/resources/reagent_alteration_upgrade_uc.png'
    },
    {
      label: 'FIRE-UP!',
      value: 'reagent_alteration_ele_fire',
      icon: '/resources/reagent_alteration_ele_fire.png'
    },
    {
      label: 'AMP-UP!',
      value: 'reagent_alteration_ele_nature',
      icon: '/resources/reagent_alteration_ele_nature.png'
    },
    {
      label: 'FROST-UP!',
      value: 'reagent_alteration_ele_water',
      icon: '/resources/reagent_alteration_ele_water.png'
    },
    {
      label: 'RE-PERK!',
      value: 'reagent_alteration_generic',
      icon: '/resources/reagent_alteration_generic.png'
    }
  ];

  function toggleFilter(type: keyof Filters, value: string) {
    filters.update((current) => {
      const set = current[type] as Set<string>;
      if (set.has(value)) {
        set.delete(value);
      } else {
        set.add(value);
      }

      return current;
    });
  }

  function toggleGroup() {
    filters.update((current) => {
      current.group = !current.group;
      return current;
    });
  }
</script>

<Sheet.Root bind:open>
  <Sheet.Content class="gap-0">
    <div class="flex flex-col gap-4 overflow-y-auto p-4">
      <div class="flex flex-col gap-2">
        <h2 class="font-medium">{$t('stwMissionAlerts.filters.zone')}</h2>
        <div class="flex flex-wrap gap-2">
          {#each zoneFilters as option (option.value)}
            <Toggle
              style="color: {option.color}"
              class="size-12 text-center text-2xl font-bold"
              onPressedChange={() => toggleFilter('zones', option.value)}
              pressed={$filters.zones.has(option.value)}
              value={option.value}
              variant="outline"
            >
              {option.label}
            </Toggle>
          {/each}
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <h2 class="font-medium">{$t('stwMissionAlerts.filters.missionType')}</h2>
          <Label>
            {$t('stwMissionAlerts.filters.group')}
            <Switch checked={$filters.group} onCheckedChange={toggleGroup} />
          </Label>
        </div>

        <div class="flex flex-wrap gap-2">
          {#each missionTypeFilters as option (option.value)}
            <Toggle
              class="size-12"
              onPressedChange={() => toggleFilter('missionTypes', option.value)}
              pressed={$filters.missionTypes.has(option.value)}
              value={option.value}
              variant="outline"
            >
              <img class="size-8" alt={option.label} src={option.icon} />
            </Toggle>
          {/each}
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <h2 class="font-medium">{$t('stwMissionAlerts.filters.rarity')}</h2>
        <div class="flex flex-wrap gap-2">
          {#each rarityFilters as option (option.value)}
            <Toggle
              class="size-12"
              onPressedChange={() => toggleFilter('rarities', option.value)}
              pressed={$filters.rarities.has(option.value)}
              value={option.value}
              variant="outline"
            >
              <img class="size-8" alt={option.label} src={option.icon} />
            </Toggle>
          {/each}
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <h2 class="font-medium">{$t('stwMissionAlerts.filters.rewards')}</h2>
        <div class="flex flex-wrap gap-2">
          {#each rewardFilters as option (option.value)}
            <Toggle
              class="size-12"
              onPressedChange={() => toggleFilter('rewards', option.value)}
              pressed={$filters.rewards.has(option.value)}
              value={option.value}
              variant="outline"
            >
              <img class="size-8" alt={option.label} src={option.icon} />
            </Toggle>
          {/each}
        </div>
      </div>
    </div>

    <Sheet.Footer class="mt-0">
      <Button onclick={() => filters.set(getDefaults())} variant="secondary">
        {$t('stwMissionAlerts.filters.reset')}
      </Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>
