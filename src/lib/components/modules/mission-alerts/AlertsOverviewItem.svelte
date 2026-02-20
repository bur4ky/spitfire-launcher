<script lang="ts">
  import { language } from '$lib/i18n';

  type Props = {
    name: string;
    icon: string;
    amount: number;
  };

  const { name, icon, amount }: Props = $props();
</script>

<div class="flex items-center gap-3 rounded-md border bg-card px-4 py-3">
  <img class="size-10" alt={name} src={icon} />
  <div>
    <p class="text-lg font-bold text-foreground tabular-nums">{amount.toLocaleString($language)}</p>
    <p class="text-xs text-muted-foreground not-xs:hidden">{name}</p>
  </div>
</div>
