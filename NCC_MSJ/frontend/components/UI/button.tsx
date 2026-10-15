"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-green-700 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-900/50",
        destructive:
          "bg-gradient-to-r from-red-700 to-red-600 text-white hover:from-red-600 hover:to-red-500 hover:scale-105",
        outline:
          "border-2 border-green-600/50 text-green-300 hover:border-green-500 hover:bg-green-900/20 hover:scale-105",
        secondary:
          "bg-gray-800/50 text-gray-300 border border-green-900/30 hover:bg-gray-800 hover:scale-105",
        ghost:
          "text-gray-400 hover:text-green-400 hover:bg-green-900/10 hover:scale-105",
        link: "text-green-400 underline-offset-4 hover:underline",
        success:
          "bg-gradient-to-r from-green-700 to-green-600 text-white hover:from-green-600 hover:to-green-500 hover:scale-105",
        warning:
          "bg-gradient-to-r from-yellow-700 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-500 hover:scale-105",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 py-3 text-base",
        xl: "h-14 rounded-xl px-10 py-4 text-lg",
        icon: "h-10 w-10",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        className={buttonVariants({ variant, size, fullWidth, className })}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
