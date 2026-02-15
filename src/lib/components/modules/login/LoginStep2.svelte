<script lang="ts">
  import { t } from '$lib/i18n';
  import { accountStore } from '$lib/storage';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';

  const activeAccount = accountStore.getActiveStore();
</script>

<div class="mt-12 flex flex-col items-center justify-center text-center">
  <div class="mb-4 rounded-full bg-muted p-4">
    <CheckCircleIcon class="size-10 text-muted-foreground" />
  </div>

  <h3 class="mb-2 text-xl font-medium">
    {$t('accountManager.welcome.title', { name: $activeAccount.displayName })}
  </h3>
  <p class="mb-6 text-muted-foreground">
    {$t('accountManager.welcome.description', { name: $activeAccount.displayName })}
  </p>
</div>
