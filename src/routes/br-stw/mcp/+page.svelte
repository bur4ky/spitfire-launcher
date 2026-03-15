<script lang="ts">
  import PageContent from '$components/layout/PageContent.svelte';
  import OperationCombobox from '$components/modules/mcp/OperationCombobox.svelte';
  import { Button } from '$components/ui/button';
  import * as Select from '$components/ui/select';
  import { t } from '$lib/i18n';
  import type { MCPOperation, MCPProfileId, MCPRoute } from '$types/game/mcp';
  import Prism from 'prismjs';
  import 'prismjs/components/prism-json';
  import { Label } from '$components/ui/label';
  import { platform } from '@tauri-apps/plugin-os';
  import { MCP } from '$lib/modules/mcp';
  import { accountStore } from '$lib/storage';
  import { toast } from 'svelte-sonner';
  import { EpicAPIError } from '$lib/exceptions/EpicAPIError';
  import { handleError } from '$lib/utils';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import CheckIcon from '@lucide/svelte/icons/check';
  import JsonNode from '$components/modules/mcp/JsonNode.svelte';
  import { writeText } from '@tauri-apps/plugin-clipboard-manager';

  const activeAccount = accountStore.getActiveStore();

  const routeOptions: MCPRoute[] = ['client', 'public', 'dedicated_server'];
  const profileOptions: MCPProfileId[] = [
    'athena',
    'creative',
    'campaign',
    'common_public',
    'collections',
    'common_core',
    'metadata',
    'collection_book_people0',
    'collection_book_schematics0',
    'outpost0',
    'theater0',
    'theater1',
    'theater2',
    'recycle_bin'
  ];

  let selectedOperation = $state<string>();
  let selectedRoute = $state<MCPRoute>();
  let selectedProfile = $state<MCPProfileId>();
  let body = $state('{}');
  let result = $state<string>();
  let isLoading = $state(false);
  let copied = $state(false);

  const highlighted = $derived(Prism.highlight(body, Prism.languages.json, 'json'));
  const formatShortcut = platform() === 'macos' ? '⌘⇧F' : 'Ctrl+Shift+F';

  const resultParsed = $derived.by(() => {
    if (!result) return null;

    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  });

  function reformat() {
    try {
      body = JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      /* empty */
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      reformat();
    }
  }

  async function copyResult() {
    if (!result || copied) return;

    await writeText(resultParsed ? JSON.stringify(resultParsed, null, 2) : result);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  async function execute() {
    if (!selectedOperation || !selectedProfile) return;

    let bodyJson: Record<string, any>;
    try {
      bodyJson = JSON.parse(body);
    } catch {
      toast.error($t('mcp.invalidBody'));
      return;
    }

    isLoading = true;
    result = undefined;

    try {
      const response = await MCP.compose(
        $activeAccount,
        selectedOperation as MCPOperation,
        selectedProfile,
        bodyJson,
        selectedRoute
      );

      result = JSON.stringify(response);
    } catch (error) {
      const message = error instanceof EpicAPIError ? error.message : null;
      handleError({
        error,
        message: message || $t('mcp.failedToExecute'),
        account: $activeAccount
      });
    } finally {
      isLoading = false;
    }
  }
</script>

<PageContent description={$t('mcp.page.description')} title={$t('mcp.page.title')}>
  <div class="grid grid-cols-1 gap-3 lg:grid-cols-3">
    <div class="flex flex-col gap-1.5">
      <Label class="text-xs text-muted-foreground uppercase" for="operation">
        {$t('mcp.operation.label')}
      </Label>

      <OperationCombobox bind:value={selectedOperation} />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label class="text-xs text-muted-foreground uppercase" for="profileId">
        {$t('mcp.profileId.label')}
      </Label>

      <Select.Root type="single" bind:value={selectedProfile}>
        <Select.Trigger id="profileId" class="w-full">
          {selectedProfile || $t('mcp.profileId.placeholder')}
        </Select.Trigger>
        <Select.Content>
          {#each profileOptions as profile (profile)}
            <Select.Item value={profile}>{profile}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>

    <div class="flex flex-col gap-1.5">
      <Label class="text-xs text-muted-foreground uppercase" for="route">
        {$t('mcp.route.label')}
      </Label>

      <Select.Root type="single" bind:value={selectedRoute}>
        <Select.Trigger id="route" class="w-full">
          {selectedRoute || $t('mcp.route.placeholder')}
        </Select.Trigger>
        <Select.Content>
          {#each routeOptions as route (route)}
            <Select.Item value={route}>{route}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
  </div>

  <div class="flex flex-col gap-1.5">
    <div class="flex items-center justify-between">
      <Label class="text-xs text-muted-foreground uppercase" for="body">
        {$t('mcp.body.label')}
      </Label>

      <button
        class="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        class:hidden={!body}
        onclick={reformat}
      >
        {$t('mcp.format')}
        <kbd class="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">{formatShortcut}</kbd>
      </button>
    </div>

    <div class="relative rounded-md font-mono text-sm has-[textarea:focus]:ring-1 has-[textarea:focus]:ring-ring">
      <div class="grid max-h-48 overflow-auto rounded-md border bg-card">
        <pre
          class="pointer-events-none col-start-1 row-start-1 m-0 overflow-hidden p-3 wrap-break-word whitespace-pre-wrap"
          aria-hidden="true"
><code class="language-json">{@html highlighted}</code></pre>
        <textarea
          id="body"
          style="field-sizing: content;"
          class="col-start-1 row-start-1 min-h-full w-full resize-none bg-transparent p-3 text-transparent caret-white outline-none focus:ring-0"
          onkeydown={onKeyDown}
          spellcheck="false"
          bind:value={body}
        ></textarea>
      </div>
    </div>
  </div>

  <Button
    class="self-end"
    disabled={!selectedOperation || !selectedProfile || isLoading}
    loading={isLoading}
    onclick={execute}
  >
    {$t('mcp.execute')}
  </Button>

  {#if result !== undefined}
    <div class="flex flex-col gap-1.5">
      <div class="relative max-h-[60vh] min-w-0 overflow-auto rounded-md border bg-card p-3 font-mono text-sm">
        <Button class="sticky top-0 left-full float-right" onclick={copyResult} size="icon-sm" variant="secondary">
          {#if copied}
            <CheckIcon />
          {:else}
            <CopyIcon />
          {/if}
        </Button>
        {#if resultParsed !== null}
          <div class="min-w-0">
            <JsonNode depth={0} value={resultParsed} />
          </div>
        {:else}
          <p class="break-all whitespace-pre-wrap text-muted-foreground">{result}</p>
        {/if}
      </div>
    </div>
  {/if}
</PageContent>

<style>
  :global(.token.string) {
    color: #a8ff60;
  }
  :global(.token.number) {
    color: #ff9d00;
  }
  :global(.token.boolean) {
    color: #ff628c;
  }
  :global(.token.null) {
    color: #ff628c;
  }
  :global(.token.property) {
    color: #9effff;
  }
  :global(.token.punctuation) {
    color: #ccc;
  }
  :global(.token.operator) {
    color: #ccc;
  }
</style>
