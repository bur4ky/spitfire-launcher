<script lang="ts">
  import { Label } from '$components/ui/label';
  import type { Snippet } from 'svelte';

  type Props = {
    title: string;
    description?: string;
    labelFor: string;
    orientation: 'horizontal' | 'vertical';
    children: Snippet;
  };

  const { title, description, labelFor, orientation, children }: Props = $props();
</script>

<div
  class={['flex', orientation === 'horizontal' ? 'flex-row items-center justify-between gap-x-4' : 'flex-col gap-y-2']}
>
  <Label class="flex flex-col items-start" for={labelFor}>
    {title}
    {#if description}
      <p class="text-sm font-normal text-muted-foreground">{description}</p>
    {/if}
  </Label>

  {@render children()}
</div>
