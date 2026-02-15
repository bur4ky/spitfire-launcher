<script lang="ts">
  import BaseModal from '$components/modules/docs/BaseModal.svelte';
  import { t } from '$lib/i18n';
  import { accountStore } from '$lib/storage';
  import { avatarCache } from '$lib/stores';

  const activeAccount = accountStore.getActiveStore();
</script>

<BaseModal title={$t('customStatus.page.title')}>
  <p>{$t('docs.customStatus.description')}</p>

  <div class="mx-auto flex h-16 w-3/4 items-center rounded-sm bg-gradient-to-r from-[#005ba3] to-[#0674b5] px-4">
    <div class="relative mr-5">
      <div class="flex size-10 items-center justify-center rounded-full bg-gradient-to-b from-[#0049ae] to-[#0570c1]">
        <img class="rounded-full" alt="Avatar" src={avatarCache.get($activeAccount.accountId)} />
      </div>
      <div class="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-[#0164aa] bg-green-500"></div>
    </div>

    <div class="flex flex-col overflow-hidden leading-tight">
      <span class="font-burbank font-semibold text-white">{$activeAccount.displayName}</span>
      <span class="font-heading-now text-sm font-semibold whitespace-nowrap text-[#78abd2] uppercase outline-none">
        {$t('docs.customStatus.status')}
      </span>
    </div>
  </div>
</BaseModal>
