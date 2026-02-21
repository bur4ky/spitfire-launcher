<script lang="ts">
  import { Input, type InputProps } from '$components/ui/input';
  import XIcon from '@lucide/svelte/icons/x';
  import { open } from '@tauri-apps/plugin-dialog';

  type Props = Omit<InputProps, 'onchange' | 'value' | 'files'> & {
    title?: string;
    value?: string | undefined;
    defaultPath?: string;
    onchange?: (path: string) => void;
    showClearButton?: boolean;
  };

  let { title, defaultPath, value = $bindable(), onchange, showClearButton = true, ...restProps }: Props = $props();

  async function handleClick() {
    const folderPath = await open({
      directory: true,
      multiple: false,
      title,
      defaultPath
    });

    if (!folderPath) return;

    value = folderPath;
    onchange?.(folderPath);
  }

  function handleClear() {
    value = undefined;
    onchange?.('');
  }
</script>

<div class="relative">
  <Input
    {...restProps}
    class="pr-10 hover:cursor-pointer"
    onclick={handleClick}
    onkeydown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    }}
    readonly
    bind:value
  />

  {#if value && showClearButton}
    <button class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" onclick={handleClear} type="button">
      <XIcon class="size-5" />
    </button>
  {/if}
</div>
