<script lang="ts" module>
  import { cn, type WithElementRef } from '$lib/utils';
  import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';
  import { tv, type VariantProps } from 'tailwind-variants';

  export const inputVariants = tv({
    base: [
      'flex w-full min-w-0 rounded-md border outline-none',
      'transition-[color,box-shadow] shadow-xs',

      'border-input bg-background text-base md:text-sm',
      'placeholder:text-muted-foreground',

      'selection:bg-primary selection:text-primary-foreground',
      'dark:bg-input/30',

      'disabled:cursor-not-allowed disabled:opacity-50',
      'aria-invalid:border-destructive',
      'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',

      'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
    ],
    variants: {
      size: {
        default: 'h-9 px-3 py-1',
        sm: 'h-8 px-2 text-sm',
        lg: 'h-10 px-4'
      },
      file: {
        true: 'bg-transparent pt-1.5 text-sm font-medium',
        false: ''
      }
    },
    defaultVariants: {
      size: 'default',
      file: false
    }
  });

  export type InputVariants = VariantProps<typeof inputVariants>;
  export type InputVariant = InputVariants['size'];
  export type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

  export type InputProps = WithElementRef<
    Omit<HTMLInputAttributes, 'type'> & ({ type: 'file'; files?: FileList } | { type?: InputType; files?: undefined })
  > &
    InputVariants;
</script>

<script lang="ts">
  let {
    ref = $bindable(),
    value = $bindable(),
    type,
    files = $bindable(),
    size,
    class: className,
    'data-slot': dataSlot = 'input',
    ...restProps
  }: InputProps = $props();
</script>

{#if type === 'file'}
  <input
    bind:this={ref}
    class={cn(inputVariants({ size, file: true }), className)}
    data-slot={dataSlot}
    type="file"
    bind:files
    bind:value
    {...restProps}
  />
{:else}
  <input
    bind:this={ref}
    class={cn(inputVariants({ size, file: false }), className)}
    data-slot={dataSlot}
    {type}
    bind:value
    {...restProps}
  />
{/if}
