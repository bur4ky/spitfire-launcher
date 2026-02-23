<script lang="ts">
  type Props = {
    count: number;
  };

  const { count }: Props = $props();
</script>

<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
{#each Array(count) as _, i (i)}
  <div class="flex flex-col gap-1 px-3 py-2 xl:flex-row xl:items-center xl:gap-2 xl:py-1.5">
    <div class="skeleton-loader hidden size-5 rounded border xl:block"></div>

    <div class="flex items-center gap-2 xl:contents">
      <div class="skeleton-loader size-6 rounded xl:size-5"></div>
      <div class="skeleton-loader h-3 w-8 rounded"></div>
      <div class="skeleton-loader h-3 w-24 rounded xl:w-36"></div>
      <div class="skeleton-loader ml-auto h-3 w-16 rounded xl:hidden"></div>
    </div>

    <div class="pl-8 xl:contents">
      <div class="flex items-center gap-1.5 xl:contents">
        <div class="flex w-64 flex-wrap items-center gap-x-1.5 gap-y-0.5 overflow-x-auto">
          <div class="skeleton-loader size-5 rounded"></div>
          <div class="skeleton-loader size-5 rounded"></div>
          <div class="skeleton-loader size-5 rounded"></div>
        </div>

        <div class="hidden flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5 overflow-x-auto xl:flex">
          <div class="skeleton-loader size-5 rounded"></div>
          <div class="skeleton-loader size-5 rounded"></div>
          <div class="skeleton-loader size-5 rounded"></div>
          <div class="skeleton-loader size-5 rounded"></div>
        </div>

        <div class="ml-auto flex items-center gap-0.5 xl:ml-0">
          <div class="skeleton-loader size-5 rounded"></div>
          <div class="skeleton-loader size-5 rounded"></div>
        </div>
      </div>

      <div class="mt-1 flex items-center gap-1.5 xl:hidden">
        <div class="skeleton-loader size-5 rounded"></div>
        <div class="skeleton-loader size-5 rounded"></div>
        <div class="skeleton-loader size-5 rounded"></div>
      </div>
    </div>
  </div>
{/each}
