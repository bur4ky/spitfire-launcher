<script lang="ts">
  import * as Combobox from '$components/ui/combobox';
  import { Input } from '$components/ui/input';
  import type { ComboboxRootProps } from 'bits-ui';
  import { t } from '$lib/utils';
  import UserIcon from '@lucide/svelte/icons/user';
  import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
  import { onMount } from 'svelte';
  import { accountStore } from '$lib/storage';

  type Props = {
    autoSelect?: boolean;
    customList?: { accountId: string; displayName: string; }[];
  } & ComboboxRootProps;

  let {
    open = $bindable(false),
    type = 'multiple',
    value = $bindable(),
    autoSelect = false,
    customList,
    ...restProps
  }: Props = $props();

  let searchValue = $state('');
  let anchorEl = $state<HTMLElement>();

  $effect(() => {
    if (searchValue) open = true;
  });

  const accountList = $derived(customList || $accountStore.accounts);
  const items = $derived(accountList.map((account) => ({
    value: account.accountId,
    label: account.displayName
  })));

  const filteredItems = $derived(
    searchValue
      ? items.filter((item) => item.label.toLowerCase().includes(searchValue.toLowerCase()))
      : items
  );

  const placeholder = $derived.by(() => {
    if (!value?.length) {
      return type === 'single'
        ? $t('accountManager.selectAccount')
        : $t('accountManager.selectAccounts');
    }

    if (type === 'single' || (type === 'multiple' && value.length < 3)) {
      return Array.isArray(value)
        ? value.map(getAccountName).join(', ')
        : getAccountName(value);
    }

    return $t('accountManager.selectedAccounts', { count: value.length });
  });

  function getAccountName(accountId: string) {
    return accountList.find((account) => account.accountId === accountId)?.displayName;
  }

  onMount(() => {
    if (autoSelect && accountList.length === 1) {
      const { accountId } = accountList[0];
      value = type === 'multiple' ? [accountId] : accountId;
    }
  });
</script>

<Combobox.Root
  type={type as never}
  bind:open
  bind:value={value as never}
  {...restProps}
>

  <div bind:this={anchorEl} class="relative w-full">
    <UserIcon class="text-muted-foreground absolute start-3 top-1/2 size-5 -translate-y-1/2" />

    <!-- Using Combobox.Input would overwrite the input with the selected value (instead of the label),
     so we use Input to control the value ourselves -->
    <Input
      class="pl-10 pr-10"
      onclick={() => (open = true)}
      {placeholder}
      bind:value={searchValue}
    />

    <Combobox.Trigger class="absolute end-0 top-1/2 -translate-y-1/2 text-muted-foreground border-none !bg-transparent">
      <ChevronsUpDown class="size-5" />
    </Combobox.Trigger>
  </div>

  <Combobox.Content customAnchor={anchorEl}>
    {#if !filteredItems.length}
      <span class="block px-2 py-1.5 text-sm text-muted-foreground">
        {$t('combobox.noResults')}
      </span>
    {:else}
      {#each filteredItems as item (item.value)}
        <Combobox.Item {...item} />
      {/each}
    {/if}
  </Combobox.Content>
</Combobox.Root>
