<script lang="ts" module>
  import { cn, type WithElementRef } from "$lib/utils";
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
  import { type VariantProps, tv } from "tailwind-variants";

  export const buttonVariants = tv({
    base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs",
        destructive:
          "bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 text-white shadow-xs",
        outline:
          "bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border shadow-xs",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  });

  export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
  export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

  export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
    WithElementRef<HTMLAnchorAttributes> & {
      variant?: ButtonVariant;
      size?: ButtonSize;
      loading?: boolean;
      loadingText?: string;
    };
</script>

<script lang="ts">
  import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";
  import { ExternalLink } from '$components/ui/external-link';

  let {
    class: className,
    variant = "default",
    size = "default",
    ref = $bindable(null),
    href = undefined,
    type = "button",
    disabled,
    loading = false,
    loadingText = "",
    children,
    ...restProps
  }: ButtonProps = $props();

  const classes = $derived(cn(
    buttonVariants({ variant, size }),
    loading ? 'flex justify-center items-center gap-x-2' : null, className
  ));
</script>

{#snippet Content()}
  {#if loading}
    <LoaderCircleIcon class="size-5 animate-spin"/>
  {/if}

  {#if loading && loadingText}
    {loadingText}
  {:else}
    {@render children?.()}
  {/if}
{/snippet}

{#if href}
  <ExternalLink
    class={classes}
    aria-disabled={disabled}
    data-slot="button"
    href={disabled ? undefined : href}
    role={disabled ? "link" : undefined}
    tabindex={disabled ? -1 : undefined}
    bind:ref
    {...restProps}
  >
    {@render Content()}
  </ExternalLink>
{:else}
  <button
    bind:this={ref}
    class={classes}
    data-slot="button"
    {disabled}
    {type}
    {...restProps}
  >
    {@render Content()}
  </button>
{/if}
