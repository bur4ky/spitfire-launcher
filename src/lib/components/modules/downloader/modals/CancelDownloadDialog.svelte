<script lang="ts">
  import { Button, buttonVariants } from '$components/ui/button';
  import * as Dialog from '$components/ui/dialog';
  import { t } from '$lib/i18n';

  type Props = {
    open: boolean;
    onConfirm: () => void;
  };

  let { open = $bindable(), onConfirm }: Props = $props();

  let isCancelling = $state(false);
</script>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        {$t('downloads.cancelDownloadConfirmation.title')}
      </Dialog.Title>

      <Dialog.Description>
        {$t('downloads.cancelDownloadConfirmation.description')}
      </Dialog.Description>
    </Dialog.Header>

    <Dialog.Footer class="grid w-full grid-cols-2 gap-2">
      <Dialog.Close class={buttonVariants({ variant: 'secondary' })}>
        {$t('cancel')}
      </Dialog.Close>

      <Button
        disabled={isCancelling}
        loading={isCancelling}
        onclick={() => {
          onConfirm();
          open = false;
        }}
      >
        {$t('confirm')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
