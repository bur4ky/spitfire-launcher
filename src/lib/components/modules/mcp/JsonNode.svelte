<script lang="ts">
  import JsonNode from '$components/modules/mcp/JsonNode.svelte';

  let { value, depth = 0 }: { value: unknown; depth?: number } = $props();

  // svelte-ignore state_referenced_locally
  let collapsed = $state(depth > 0 && (Array.isArray(value) || (typeof value === 'object' && value !== null)));
  const isObject = $derived(typeof value === 'object' && value !== null && !Array.isArray(value));
  const isArray = $derived(Array.isArray(value));
  const entries = $derived(
    isObject
      ? Object.entries(value as Record<string, unknown>)
      : isArray
        ? (value as unknown[]).map((v, i) => [i, v] as [unknown, unknown])
        : []
  );
  const isEmpty = $derived(entries.length === 0);
  const brackets = $derived(isArray ? ['[', ']'] : ['{', '}']);
</script>

{#if isObject || isArray}
  <span class="min-w-0">
    <button
      class="rounded px-0.5 transition-colors hover:bg-white/10"
      aria-label={collapsed ? 'Expand' : 'Collapse'}
      onclick={() => (collapsed = !collapsed)}
    >
      <span class="text-[10px] opacity-50">{collapsed ? '▶' : '▼'}</span>
    </button>
    <span class="text-[#ccc]">{brackets[0]}</span>
    {#if collapsed}
      <button
        class="rounded px-1 text-xs opacity-40 transition-opacity hover:opacity-70"
        onclick={() => (collapsed = false)}
      >
        {isArray ? `${(value as unknown[]).length} items` : `${Object.keys(value as object).length} keys`}
      </button>
      <span class="text-[#ccc]">{brackets[1]}</span>
    {:else}
      {#if !isEmpty}
        <div class="ml-4 border-l border-white/10 pl-3">
          {#each entries as [k, v], i (k)}
            <div class="min-w-0">
              {#if isObject}
                <span class="break-all text-[#9effff]">"{k}"</span><span class="text-[#ccc]">: </span>
              {/if}
              <JsonNode depth={depth + 1} value={v} />{#if i < entries.length - 1}<span class="text-[#ccc]">,</span>{/if}
            </div>
          {/each}
        </div>
      {/if}
      <span class="text-[#ccc]">{brackets[1]}</span>
    {/if}
  </span>
{:else if typeof value === 'string'}
  <span class="break-all text-[#a8ff60]">"{value}"</span>
{:else if typeof value === 'number'}
  <span class="text-[#ff9d00]">{value}</span>
{:else if typeof value === 'boolean'}
  <span class="text-[#ff628c]">{value}</span>
{:else if value === null}
  <span class="text-[#ff628c]">null</span>
{/if}
