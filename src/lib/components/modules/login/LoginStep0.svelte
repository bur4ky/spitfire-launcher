<script lang="ts" module>
  export type LoginMethod = 'webConfirmation' | 'exchangeCode';
</script>

<script lang="ts">
  import { t } from '$lib/i18n';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import KeyIcon from '@lucide/svelte/icons/key';

  type Props = {
    selectLoginMethod: (method: LoginMethod) => void;
  };

  const { selectLoginMethod }: Props = $props();

  const loginMethods: {
    id: LoginMethod;
    name: string;
    description: string;
    icon: any;
    recommended?: boolean;
  }[] = $derived([
    {
      id: 'webConfirmation',
      name: $t('accountManager.loginMethods.webConfirmation.title'),
      description: $t('accountManager.loginMethods.webConfirmation.description'),
      icon: GlobeIcon,
      recommended: true
    },
    {
      id: 'exchangeCode',
      name: $t('accountManager.loginMethods.exchangeCode.title'),
      description: $t('accountManager.loginMethods.exchangeCode.description'),
      icon: KeyIcon
    }
  ]);
</script>

<div>
  <h3 class="mb-4 text-lg font-medium">
    {$t('accountManager.chooseLoginMethod')}
  </h3>

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {#each loginMethods as method (method.id)}
      {@const Icon = method.icon}

      <button
        class="flex flex-col items-center rounded-lg border bg-background p-4 transition hover:bg-muted/50"
        onclick={() => selectLoginMethod(method.id)}
      >
        <span class="mb-3 rounded-full bg-muted p-3">
          <Icon class="size-8 text-muted-foreground" />
        </span>

        <span class="mb-1 font-medium">
          {method.name}
        </span>

        <span class="text-center text-sm text-muted-foreground">
          {method.description}
        </span>

        {#if method.recommended}
          <span class="mt-2 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            {$t('accountManager.recommended')}
          </span>
        {/if}
      </button>
    {/each}
  </div>
</div>
