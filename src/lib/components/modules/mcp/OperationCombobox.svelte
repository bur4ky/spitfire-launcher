<script lang="ts">
  import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
  import { MCPOperations } from '$lib/constants/mcp';
  import { t } from '$lib/i18n';
  import { cn } from '$lib/utils';
  import * as Combobox from '$components/ui/combobox';
  import { inputVariants } from '$components/ui/input';

  type Props = {
    open?: boolean;
    value?: string;
  };

  let { open = $bindable(false), value = $bindable() }: Props = $props();

  let searchValue = $state('');
  let anchorEl = $state<HTMLElement>();

  const filteredItems = $derived(
    searchValue ? MCPOperations.filter((item) => item.toLowerCase().includes(searchValue.toLowerCase())) : MCPOperations
  );

  $effect(() => {
    if (searchValue) open = true;
  });
</script>

<Combobox.Root type="single" bind:value bind:open>
  <div bind:this={anchorEl} class="relative w-full">
    <Combobox.Input
      id="operation"
      class={cn(inputVariants(), 'pr-10')}
      onclick={() => (open = true)}
      oninput={(e) => (searchValue = e.currentTarget.value)}
      placeholder={$t('mcp.operation.placeholder')}
    />

    <Combobox.Trigger class="absolute end-0 top-1/2 -translate-y-1/2 border-none !bg-inherit text-muted-foreground">
      <ChevronsUpDown class="size-5" />
    </Combobox.Trigger>
  </div>

  <Combobox.Content customAnchor={anchorEl}>
    {#if !filteredItems.length}
      <span class="block px-2 py-1.5 text-sm text-muted-foreground">
        {$t('combobox.noResults')}
      </span>
    {:else}
      {#each filteredItems as item (item)}
        <Combobox.Item label={item} value={item} />
      {/each}
    {/if}
  </Combobox.Content>
</Combobox.Root>
