<script lang="ts">
  import { Label } from '$components/ui/label';
  import { Switch } from '$components/ui/switch';

  type Props = {
    id: string;
    label: string;
    description?: string;
    checked: boolean;
  };

  let { id, label, description, checked = $bindable() }: Props = $props();
</script>

<div class="flex items-center justify-between gap-4 py-3">
  <Label class="flex flex-col items-start gap-0" for={id}>
    <p class="text-sm font-medium text-foreground">{label}</p>
    <p class="text-xs font-normal text-muted-foreground">{description}</p>
  </Label>

  <Switch {id} bind:checked />
</div>
