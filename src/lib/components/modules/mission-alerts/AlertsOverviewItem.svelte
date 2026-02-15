<script lang="ts">
  import { language } from '$lib/i18n';

  type Props = {
    name: string;
    icon: string;
    amount: number;
  };

  const { name, icon, amount }: Props = $props();
</script>

<div class="flex items-center rounded-md border">
  <img class="size-10 rounded-l-md bg-muted-foreground/10 p-1" alt={name} src={icon} />

  <span class="grow px-2 text-center font-medium">
    {amount.toLocaleString($language)}
  </span>
</div>
