<script lang="ts">
  import * as Dialog from '$components/ui/dialog';
  import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
  import type { Snippet } from 'svelte';

  type Props = {
    title?: string;
    description?: string;
    children: Snippet;
  };

  const { title, description, children }: Props = $props();
</script>

<Dialog.Root>
  <Dialog.Trigger>
    <HelpCircleIcon class="text-muted-foreground hover:text-foreground transition-colors size-6"/>
  </Dialog.Trigger>

  <Dialog.Content>
    {#if title || description}
      <Dialog.Header>
        {#if title}
          <Dialog.Title>{title}</Dialog.Title>
        {/if}
        {#if description}
          <Dialog.Description>{description}</Dialog.Description>
        {/if}
      </Dialog.Header>
    {/if}

    <div class="prose dark:prose-invert prose-sm">
      {@render children()}
    </div>
  </Dialog.Content>
</Dialog.Root>