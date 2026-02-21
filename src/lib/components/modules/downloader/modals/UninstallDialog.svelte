<script lang="ts">
  import { Button, buttonVariants } from '$components/ui/button';
  import * as Dialog from '$components/ui/dialog';
  import { t } from '$lib/i18n';
  import { Legendary } from '$lib/modules/legendary';
  import { ownedApps } from '$lib/stores';
  import { cn, handleError } from '$lib/utils';
  import { toast } from 'svelte-sonner';

  type Props = {
    id: string;
  };

  let { id = $bindable() }: Props = $props();

  const app = $derived($ownedApps.find((x) => x.id === id)!);

  let isOpen = $state(true);
  let isDeleting = $state(false);

  async function uninstallApp() {
    isDeleting = true;

    try {
      await Legendary.uninstall(app.id);
      toast.success($t('library.uninstallConfirmation.uninstalled', { name: app.title }));
    } catch (error) {
      handleError({ error, message: $t('library.uninstallConfirmation.failedToUninstall', { name: app.title }) });
    } finally {
      isDeleting = false;
      isOpen = false;
    }
  }
</script>

<Dialog.Root onOpenChangeComplete={(open) => !open && (id = '')} bind:open={isOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        {$t('library.uninstallConfirmation.title')}
      </Dialog.Title>

      <Dialog.Description>
        {$t('library.uninstallConfirmation.description', { name: app.title })}
      </Dialog.Description>
    </Dialog.Header>

    <Dialog.Footer class="flex w-full items-center justify-center gap-2">
      <Dialog.Close class={cn(buttonVariants({ variant: 'secondary' }), 'flex-1')}>
        {$t('cancel')}
      </Dialog.Close>

      <Button class="flex flex-1 items-center gap-2" disabled={isDeleting} loading={isDeleting} onclick={uninstallApp}>
        {$t('confirm')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
