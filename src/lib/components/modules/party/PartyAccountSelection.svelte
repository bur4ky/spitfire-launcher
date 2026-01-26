<script lang="ts">
  import AccountCombobox from '$components/ui/AccountCombobox.svelte';
  import { Button } from '$components/ui/button';
  import type { Snippet } from 'svelte';

  type Props = {
    type: 'single' | 'multiple';
    value: string | string[];
    disabled?: boolean;
    loading?: boolean;
    onclick?: () => void;
    children: Snippet;
  };

  let {
    type,
    value = $bindable(),
    disabled,
    loading,
    onclick,
    children
  }: Props = $props();

</script>

<div class="flex flex-col gap-4 border rounded-md p-4">
  <AccountCombobox
    type={type as never}
    bind:value={value as never}
  />

  <Button
    {disabled}
    {loading}
    {onclick}
  >
    {@render children()}
  </Button>
</div>