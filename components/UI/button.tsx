import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-[120ms] ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:opacity-50 disabled:grayscale [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--vto-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vto-bg-primary)]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--vto-accent-primary)] text-[var(--vto-bg-primary)] hover:bg-[var(--vto-accent-primary-hover)] hover:scale-[1.03] hover:shadow-[0_0_12px_var(--vto-glow-primary)] active:scale-[0.97] active:shadow-[0_0_18px_var(--vto-glow-primary)]",
        secondary:
          "bg-transparent text-[var(--vto-accent-secondary)] border border-[var(--vto-border-soft)] hover:bg-[var(--vto-accent-secondary)]/10 hover:text-[var(--vto-accent-secondary-hover)] hover:shadow-[0_0_12px_var(--vto-glow-cyan)]",
        emotional:
          "bg-[var(--vto-accent-rose)] text-white hover:bg-[var(--vto-accent-rose-hover)] hover:scale-[1.03] hover:shadow-[0_0_12px_var(--vto-glow-rose)] active:scale-[0.97]",
        outline:
          "border border-[var(--vto-border-soft)] bg-transparent text-[var(--foreground)] hover:bg-[var(--vto-bg-glass)] hover:border-[var(--vto-border-soft)]",
        ghost:
          "text-[var(--foreground)] hover:bg-[var(--vto-bg-glass)]",
        destructive:
          "bg-[var(--vto-status-error)] text-white hover:opacity-90",
        link: "text-[var(--vto-accent-primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3 rounded-xl",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5 rounded-lg",
        lg: "h-10 px-6 has-[>svg]:px-4 rounded-xl",
        icon: "size-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
