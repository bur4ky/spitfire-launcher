<script lang="ts">
  type Props = {
    count: number;
  };

  const { count }: Props = $props();
</script>

<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
{#each Array(count) as _, i (i)}
  <!-- Desktop -->
  <div class="hidden items-center gap-2 px-3 py-1.5 sm:flex">
    <div class="skeleton-loader size-5 rounded border"></div>
    <div class="skeleton-loader size-5 rounded"></div>
    <div class="skeleton-loader h-3 w-8 rounded"></div>
    <div class="skeleton-loader h-3 w-32 rounded"></div>
    <div class="flex w-64 gap-1.5">
      <div class="skeleton-loader size-5 rounded"></div>
      <div class="skeleton-loader size-5 rounded"></div>
      <div class="skeleton-loader size-5 rounded"></div>
    </div>

    <div class="flex flex-1 gap-1.5">
      <div class="skeleton-loader size-5 rounded"></div>
      <div class="skeleton-loader size-5 rounded"></div>
      <div class="skeleton-loader size-5 rounded"></div>
      <div class="skeleton-loader size-5 rounded"></div>
    </div>

    <div class="flex gap-0.5">
      <div class="skeleton-loader size-5 rounded"></div>
      <div class="skeleton-loader size-5 rounded"></div>
    </div>
  </div>

  <!-- Mobile -->
  <div class="flex flex-col gap-1 px-3 py-2 sm:hidden">
    <div class="flex items-center gap-2">
      <div class="skeleton-loader size-6 rounded"></div>
      <div class="skeleton-loader h-3 w-10 rounded"></div>
      <div class="skeleton-loader h-3 w-24 rounded"></div>
      <div class="skeleton-loader ml-auto h-3 w-16 rounded"></div>
    </div>

    <div class="pl-8">
      <div class="flex gap-1.5">
        <div class="skeleton-loader size-5 rounded"></div>
        <div class="skeleton-loader size-5 rounded"></div>
        <div class="skeleton-loader size-5 rounded"></div>

        <div class="ml-auto flex gap-0.5">
          <div class="skeleton-loader size-5 rounded"></div>
          <div class="skeleton-loader size-5 rounded"></div>
        </div>
      </div>

      <div class="mt-1 flex gap-1.5">
        <div class="skeleton-loader size-5 rounded"></div>
        <div class="skeleton-loader size-5 rounded"></div>
        <div class="skeleton-loader size-5 rounded"></div>
      </div>
    </div>
  </div>
{/each}
