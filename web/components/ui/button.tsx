import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn-cut inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-medium transition-[background,box-shadow,color,transform] duration-150 outline-none select-none focus-visible:ring-1 focus-visible:ring-cyan disabled:pointer-events-none disabled:opacity-40 active:translate-y-px cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-cyan/12 text-cyan hover:bg-cyan/22 shadow-[inset_0_0_0_1px_rgb(56_232_255/0.55),0_0_18px_rgb(56_232_255/0.12)] hover:shadow-[inset_0_0_0_1px_rgb(56_232_255/0.9),0_0_26px_rgb(56_232_255/0.3)]",
        violet: "bg-violet/15 text-[#c9b8ff] hover:bg-violet/28 shadow-[inset_0_0_0_1px_rgb(139_92_255/0.6),0_0_18px_rgb(139_92_255/0.15)] hover:shadow-[inset_0_0_0_1px_rgb(139_92_255/0.95),0_0_26px_rgb(139_92_255/0.35)]",
        danger: "bg-[#ff5a1f]/15 text-[#ffb089] hover:bg-[#ff5a1f]/28 shadow-[inset_0_0_0_1px_rgb(255_110_50/0.7),0_0_22px_rgb(255_90_31/0.2)] hover:shadow-[inset_0_0_0_1px_rgb(255_140_80/1),0_0_32px_rgb(255_90_31/0.45)]",
        ghost: "text-dim hover:text-cyan hover:bg-cyan/8 shadow-[inset_0_0_0_1px_rgb(56_232_255/0.18)]",
      },
      size: {
        default: "h-9 px-4 text-[13px]",
        sm: "h-7 px-3 text-[12px]",
        lg: "h-10 px-5 text-[13px]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
