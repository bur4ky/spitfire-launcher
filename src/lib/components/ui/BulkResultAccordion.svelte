<script generics="T" lang="ts">
  import * as Accordion from '$components/ui/accordion';
  import { avatarCache } from '$lib/stores';
  import type { BulkState } from '$types/account';
  import type { Snippet } from 'svelte';

  type Props = {
    states: BulkState<T>[];
    content: Snippet<[BulkState<T>]>;
  };

  const { states, content: accordionContent }: Props = $props();
</script>

<Accordion.Root class="group space-y-2 rounded-lg" type="multiple">
  {#each states as state, index (index.toString())}
    <Accordion.Item value="item-{index}">
      <Accordion.Trigger
        class="flex items-center justify-between rounded-lg bg-accent px-3 py-2 data-[state=open]:rounded-b-none"
      >
        <div class="flex items-center gap-2">
          <img
            class="size-6 rounded-full"
            alt="Avatar"
            src={avatarCache.get(state.accountId) || '/misc/default-outfit-icon.png'}
          />
          <span class="truncate font-semibold">{state.displayName}</span>
        </div>
      </Accordion.Trigger>

      <Accordion.Content class="rounded-b-lg bg-card">
        {@render accordionContent(state)}
      </Accordion.Content>
    </Accordion.Item>
  {/each}
</Accordion.Root>
