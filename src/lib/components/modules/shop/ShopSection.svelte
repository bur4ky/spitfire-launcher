<script lang="ts">
  import ShopItemCard from '$components/modules/shop/ShopItemCard.svelte';
  import type { SpitfireShopSection } from '$types/game/shop';

  type ShopSectionProps = {
    section: SpitfireShopSection;
    modalOfferId: string;
  };

  let { section, modalOfferId = $bindable() }: ShopSectionProps = $props();
</script>

<div class="flex flex-col items-center">
  <h2 class="mb-4 w-full text-2xl font-extrabold tracking-wider uppercase">
    {section.name}
  </h2>

  <div class="@container w-full">
    <div
      class="grid gap-4 @max-[90rem]:grid-cols-7 @max-[75rem]:grid-cols-6 @max-[60rem]:grid-cols-5 @max-[48rem]:grid-cols-4 @max-[36rem]:grid-cols-3 @max-[28rem]:grid-cols-2"
    >
      {#each section.items as item (item.offerId)}
        <ShopItemCard {item} bind:modalOfferId />
      {/each}
    </div>
  </div>
</div>
