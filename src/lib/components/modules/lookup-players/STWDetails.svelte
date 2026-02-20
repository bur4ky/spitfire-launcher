<script lang="ts" module>
  import type { RarityType } from '$types/game/stw/resources';

  export type LoadoutData = {
    guid: string;
    selected?: boolean;
    index: number;
    commander?: {
      name: string;
      icon: string;
      rarity: RarityType;
    };
    teamPerk?: {
      name: string;
      icon: string;
    };
    supportTeam?: Array<{
      name: string;
      icon: string;
      rarity: RarityType;
    }>;
    gadgets?: Array<{
      name: string;
      icon: string;
    }>;
  };
</script>

<script lang="ts">
  import Pagination from '$components/ui/Pagination.svelte';
  import { RarityColors } from '$lib/constants/stw/resources';
  import { Separator } from '$components/ui/separator';
  import { t } from '$lib/i18n';

  type Props = {
    loadoutData?: LoadoutData[];
    heroLoadoutPage: number;
  };

  let { loadoutData, heroLoadoutPage = $bindable() }: Props = $props();

  const selectedHeroLoadout = $derived(loadoutData?.[heroLoadoutPage - 1]);
</script>

{#if loadoutData?.length}
  <Separator orientation="horizontal" />

  <h3 class="text-center text-lg font-semibold">{$t('lookupPlayers.stwDetails.title')}</h3>

  {#if selectedHeroLoadout && loadoutData?.length}
    <div class="flex flex-col items-center gap-4">
      {#if selectedHeroLoadout}
        <div class="grid grid-cols-1 place-items-center max-md:gap-4 xs:grid-cols-2 md:grid-cols-4">
          {#if selectedHeroLoadout.commander}
            <div class="flex flex-col items-center gap-y-1">
              <span class="text-lg font-semibold">{$t('lookupPlayers.stwDetails.heroLoadout.commander')}</span>
              <img
                style="background-color: {RarityColors[selectedHeroLoadout.commander.rarity]}"
                class="size-12 rounded-sm"
                alt={selectedHeroLoadout.commander.name}
                src={selectedHeroLoadout.commander.icon}
                title={selectedHeroLoadout.commander.name}
              />
            </div>
          {/if}

          {#if selectedHeroLoadout.teamPerk}
            <div class="flex flex-col items-center gap-y-1">
              <span class="text-lg font-semibold">{$t('lookupPlayers.stwDetails.heroLoadout.teamPerk')}</span>
              <img
                class="size-12 rounded-sm"
                alt={selectedHeroLoadout.teamPerk.name}
                src={selectedHeroLoadout.teamPerk.icon}
                title={selectedHeroLoadout.teamPerk.name}
              />
            </div>
          {/if}

          {#if selectedHeroLoadout.supportTeam?.length}
            <div class="flex flex-col items-center gap-y-1">
              <span class="text-lg font-semibold md:hidden">
                {$t('lookupPlayers.stwDetails.heroLoadout.supportTeam')}
              </span>
              <div class="grid grid-cols-3 gap-2">
                {#each selectedHeroLoadout.supportTeam as support (support.name)}
                  <div class="flex size-10 items-center justify-center" title={support.name}>
                    <img
                      style="background-color: {RarityColors[support.rarity]}"
                      class="rounded-md"
                      alt={support.name}
                      src={support.icon}
                    />
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if selectedHeroLoadout.gadgets?.length}
            <div class="flex flex-col items-center gap-y-1">
              <span class="text-lg font-semibold md:hidden">{$t('lookupPlayers.stwDetails.heroLoadout.gadgets')}</span>
              {#each selectedHeroLoadout.gadgets as gadget (gadget.name)}
                <img class="size-10" alt={gadget.name} src={gadget.icon} title={gadget.name} />
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      <Pagination count={loadoutData.length} perPage={1} bind:page={heroLoadoutPage} />
    </div>
  {/if}
{/if}
