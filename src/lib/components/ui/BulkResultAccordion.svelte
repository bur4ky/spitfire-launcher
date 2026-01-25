<script generics="T" lang="ts">
  import * as Accordion from '$components/ui/accordion';
  import type { Snippet } from 'svelte';
  import type { BulkActionStatus } from '$types/accounts';

  type Props = {
    statuses: BulkActionStatus<T>[];
    content: Snippet<[BulkActionStatus<T>]>;
  };

  const { statuses, content: accordionContent }: Props = $props();
</script>

<Accordion.Root class="rounded-lg space-y-2 group" type="multiple">
  {#each statuses as status, index (index.toString())}
    <Accordion.Item value="item-{index}">
      <Accordion.Trigger class="flex items-center justify-between px-3 py-2 bg-accent rounded-lg data-[state=open]:rounded-b-none">
        <span class="font-semibold truncate">{status.displayName}</span>
      </Accordion.Trigger>

      <Accordion.Content class="bg-card rounded-b-lg">
        {@render accordionContent(status)}
      </Accordion.Content>
    </Accordion.Item>
  {/each}
</Accordion.Root>