<script lang="ts">
  import { cn } from '$lib/utils';
  import type { Component, Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    title?: string | Snippet;
    description?: string | Snippet;
    class?: ClassValue;
    center?: boolean;
    children: Snippet;
    docsComponent?: Component;
  };

  const { title, description, class: className, center = false, children, docsComponent }: Props = $props();

  const DocsComponent = $derived(docsComponent as Snippet | undefined);
</script>

<div class={center ? 'mx-auto flex min-h-full max-w-lg flex-col items-center justify-center' : ''}>
  {#if title || description}
    <div class="flex w-full flex-col gap-1.5">
      {#if title}
        <div class="flex items-center gap-2">
          {#if typeof title === 'string'}
            <h2 class="text-4xl font-bold max-xs:text-3xl">{title}</h2>
          {:else}
            {@render title()}
          {/if}

          {@render DocsComponent?.()}
        </div>
      {/if}

      {#if description}
        {#if typeof description === 'string'}
          <p class="text-muted-foreground">{description}</p>
        {:else}
          {@render description()}
        {/if}
      {/if}
    </div>
  {/if}

  <div class={cn('flex w-full flex-col gap-4', (title || description) && 'mt-4', className)}>
    {@render children()}
  </div>
</div>
