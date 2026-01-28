<script lang="ts">
  import * as Select from '$components/ui/select';
  import FilterIcon from '@lucide/svelte/icons/filter';
  import type { AppFilterValue } from '$types/legendary';
  import { t } from '$lib/i18n';

  const filters: { label: string; value: AppFilterValue }[] = $derived([
    { label: $t('library.filters.showHidden'), value: 'hidden' },
    { label: $t('library.filters.installedOnly'), value: 'installed' },
    { label: $t('library.filters.updatesAvailable'), value: 'updatesAvailable' }
  ]);

  type Props = {
    value?: AppFilterValue[];
  };

  let { value = $bindable() }: Props = $props();
</script>

<Select.Root allowDeselect={true} type="multiple" bind:value={value}>
  <Select.Trigger class="min-w-40">
    <FilterIcon class="size-5" />
    {filters.find((x) => x.value === value?.at(-1))?.label || $t('library.filters.select')}
  </Select.Trigger>

  <Select.Content>
    {#each filters as filter (filter.value)}
      <Select.Item value={filter.value}>
        {filter.label}
      </Select.Item>
    {/each}
  </Select.Content>
</Select.Root>

