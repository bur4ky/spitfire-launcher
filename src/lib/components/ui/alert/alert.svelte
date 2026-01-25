<script lang="ts">
  type Props = {
    title: string;
    message: string;
    color: 'red' | 'green' | 'blue' | 'yellow' | 'orange' | 'indigo' | 'purple' | 'pink' | 'gray';
    icon?: any;
  };

  const iconColors: Record<Props['color'], string> = {
    red: 'text-red-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
    yellow: 'text-yellow-500',
    orange: 'text-orange-500',
    indigo: 'text-indigo-500',
    purple: 'text-purple-500',
    pink: 'text-pink-500',
    gray: 'text-gray-500'
  };

  const backgroundcolors: Record<Props['color'], string> = {
    red: 'bg-red-500/20 border-red-500/50',
    green: 'bg-green-500/20 border-green-500/50',
    blue: 'bg-blue-500/20 border-blue-500/50',
    yellow: 'bg-yellow-500/20 border-yellow-500/50',
    orange: 'bg-orange-500/20 border-orange-500/50',
    indigo: 'bg-indigo-500/20 border-indigo-500/50',
    purple: 'bg-purple-500/20 border-purple-500/50',
    pink: 'bg-pink-500/20 border-pink-500/50',
    gray: 'bg-gray-500/20 border-gray-500/50'
  };

  const {
    title,
    message,
    color,
    icon: Icon
  }: Props = $props();
</script>

<div class="border rounded-lg p-3 mb-2 {backgroundcolors[color]}">
  <div class="flex items-center gap-2">
    {#if Icon}
      <Icon class="size-5 {iconColors[color]}"/>
    {/if}
    <span class="font-medium">{title}</span>
  </div>

  {#if message}
    <p class="text-sm mt-1">{message}</p>
  {/if}
</div>