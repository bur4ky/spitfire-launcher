<script lang="ts">
  import ShopItemCardSkeleton from '$components/modules/shop/skeletons/ShopItemCardSkeleton.svelte';

  const min = 2;
  const max = 4;
  const itemCount = Math.floor(Math.random() * (max - min + 1)) + min;
</script>

<div class="flex w-full flex-col items-center">
  <div class="skeleton-loader mb-4 h-7 w-48 self-start rounded-md"></div>
  <div class="@container w-full">
    <div
      class="grid gap-4 @max-[90rem]:grid-cols-7 @max-[75rem]:grid-cols-6 @max-[60rem]:grid-cols-5 @max-[48rem]:grid-cols-4 @max-[36rem]:grid-cols-3 @max-[28rem]:grid-cols-2"
    >
      <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
      {#each Array(itemCount) as _, index (index)}
        <ShopItemCardSkeleton />
      {/each}
    </div>
  </div>
</div>
