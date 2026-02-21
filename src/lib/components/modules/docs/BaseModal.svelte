<script lang="ts">
  import * as Dialog from '$components/ui/dialog';
  import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
  import type { Snippet } from 'svelte';

  type Props = {
    title?: string;
    children: Snippet;
  };

  const { title, children }: Props = $props();
</script>

<Dialog.Root>
  <Dialog.Trigger>
    <HelpCircleIcon class="size-6 text-muted-foreground transition-colors hover:text-foreground" />
  </Dialog.Trigger>

  <Dialog.Content>
    {#if title}
      <Dialog.Header>
        <Dialog.Title>{title}</Dialog.Title>
      </Dialog.Header>
    {/if}

    <div class="prose prose-sm dark:prose-invert">
      {@render children()}
    </div>
  </Dialog.Content>
</Dialog.Root>
