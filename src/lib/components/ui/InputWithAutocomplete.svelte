<script lang="ts">
  import { avatarCache, displayNamesCache } from '$lib/stores';
  import { Input, type InputProps } from '$components/ui/input';
  import * as DropdownMenu from '$components/ui/dropdown-menu';
  import debounce from '$lib/debounce';
  import Lookup from '$lib/modules/lookup';
  import { accountStore } from '$lib/storage';

  const activeAccount = accountStore.getActiveStore(true);

  let { value = $bindable<string>(), ...restProps }: InputProps = $props();

  let inputElement = $state<HTMLInputElement>();
  let dropdownAvailable = $state(true);
  let selectedItemId = $state<string>();

  const debouncedSearch = debounce(async (search: string) => {
    if (!$activeAccount || !search || search.length < 3) return;
    await Lookup.searchByName($activeAccount, search);
  }, 500);

  const autocompleteData = $derived.by(() => {
    if (!value) return [];

    return displayNamesCache.entries().toArray()
      .filter(([id, name]) => name?.toLowerCase().includes(value.toLowerCase()) || id === value)
      .sort(([idA, nameA], [idB, nameB]) => {
        const isFriendA = avatarCache.has(idA);
        const isFriendB = avatarCache.has(idB);

        if (isFriendA && !isFriendB) return -1;
        if (!isFriendA && isFriendB) return 1;

        if (nameA === value || idA === value) return -1;
        if (nameB === value || idB === value) return 1;

        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
      });
  });

  const hasAutoComplete = $derived(!!(value && autocompleteData.length));

  function handleInput() {
    selectedItemId = undefined;
    dropdownAvailable = true;

    if (value) {
      debouncedSearch(value);
    }
  }
</script>

<div class="relative w-full">
  <Input
    oninput={handleInput}
    bind:ref={inputElement}
    bind:value
    {...restProps}
  />

  <DropdownMenu.Root
    bind:open={
     () => dropdownAvailable && hasAutoComplete && !selectedItemId,
     () => dropdownAvailable = false
    }
  >
    <DropdownMenu.Content
      class="w-(--bits-floating-anchor-width) max-h-72"
      customAnchor={inputElement}
      onOpenAutoFocus={(event) => event.preventDefault()}
    >
      {#each autocompleteData as [accountId, name] (accountId)}
        <DropdownMenu.Item
          class="grow w-full"
          onclick={() => {
            value = name;
            selectedItemId = accountId;
            inputElement?.focus();
          }}
        >
          <img
            class="size-6 rounded-full mr-2"
            alt={name}
            src={avatarCache.get(accountId) || '/misc/default-outfit-icon.png'}
          />
          <span class="text-sm">{name}</span>
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>