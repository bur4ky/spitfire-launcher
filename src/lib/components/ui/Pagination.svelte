<script lang="ts">
  import * as Pagination from '$lib/components/ui/pagination';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import type { PaginationRootProps } from 'bits-ui';

  let { page = $bindable(), ...restProps }: PaginationRootProps = $props();
</script>

<Pagination.Root {...restProps} bind:page>
  {#snippet children({ pages, currentPage })}
    <Pagination.Content>
      <Pagination.Item>
        <Pagination.PrevButton>
          <ChevronLeftIcon class="size-4" />
        </Pagination.PrevButton>
      </Pagination.Item>

      {#each pages as page (page.key)}
        {#if page.type === "ellipsis"}
          <Pagination.Item>
            <Pagination.Ellipsis />
          </Pagination.Item>
        {:else}
          <Pagination.Item>
            <Pagination.Link isActive={currentPage === page.value} {page}>
              {page.value}
            </Pagination.Link>
          </Pagination.Item>
        {/if}
      {/each}

      <Pagination.Item>
        <Pagination.NextButton>
          <ChevronRightIcon class="size-4" />
        </Pagination.NextButton>
      </Pagination.Item>
    </Pagination.Content>
  {/snippet}
</Pagination.Root>