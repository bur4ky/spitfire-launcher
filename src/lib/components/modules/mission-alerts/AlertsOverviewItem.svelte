<script lang="ts">
  import { language } from '$lib/i18n';

  type Props = {
    name: string;
    icon: string;
    amount: number;
  };

  const { name, icon, amount }: Props = $props();
</script>

<div class="flex items-center border rounded-md">
  <img class="size-10 rounded-l-md bg-muted-foreground/10 p-1" alt={name} src={icon} />

  <span class="grow px-2 font-medium text-center">
    {amount.toLocaleString($language)}
  </span>
</div>
