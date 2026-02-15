<script lang="ts">
  import { Button, buttonVariants } from '$components/ui/button';
  import * as Dialog from '$components/ui/dialog';
  import { t } from '$lib/i18n';
  import { cn } from '$lib/utils';

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

    <Dialog.Footer class="flex w-full items-center justify-center gap-2">
      <Dialog.Close class={cn(buttonVariants({ variant: 'secondary' }), 'flex-1')}>
        {$t('cancel')}
      </Dialog.Close>

      <Button
        class="flex flex-1 items-center gap-2"
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
