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

  const {
    title,
    description,
    class: className,
    center = false,
    children,
    docsComponent
  }: Props = $props();

  const DocsComponent = $derived(docsComponent as Snippet | undefined);
</script>

<div class={center ? 'max-w-lg mx-auto min-h-full flex flex-col items-center justify-center' : ''}>
  {#if title || description}
    <div class="flex flex-col gap-1.5 w-full">
      {#if title}
        <div class="flex items-center gap-2">
          {#if typeof title === 'string'}
            <h2 class="max-xs:text-3xl text-4xl font-bold">{title}</h2>
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

  <div class={cn('flex flex-col gap-4 w-full', (title || description) && 'mt-4', className)}>
    {@render children()}
  </div>
</div>