<script lang="ts">
  import type { WithElementRef } from '$lib/utils';
  import { openUrl } from '@tauri-apps/plugin-opener';
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  type ExternalLinkProps = WithElementRef<Omit<HTMLAnchorAttributes, 'onclick'>> & {
    children: Snippet;
  };

  let {
    ref = $bindable(null),
    href,
    children,
    ...restProps
  }: ExternalLinkProps = $props();
</script>

{#if href?.startsWith('/')}
  <a
    bind:this={ref}
    {href}
    {...restProps}
  >
    {@render children()}
  </a>
{:else}
  <a
    bind:this={ref}
    {href}
    onclick={(event) => {
      event.preventDefault();
      if (href) openUrl(href);
    }}
    {...restProps}
  >
    {@render children()}
  </a>
{/if}