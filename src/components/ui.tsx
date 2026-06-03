"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
} from "react";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const inputClass =
  "h-12 w-full rounded-xl border border-border bg-surface px-4 text-fg " +
  "placeholder:text-muted/70 outline-none transition-colors " +
  "focus:border-accent focus:ring-2 focus:ring-accent/30";

export const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputClass, className)} {...props} />
));
TextInput.displayName = "TextInput";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg shadow-[0_8px_24px_-10px_var(--accent)] hover:brightness-105 active:brightness-95",
  secondary:
    "bg-surface-2 text-fg border border-border hover:border-accent/60 hover:bg-surface",
  ghost: "text-fg hover:bg-surface-2",
  danger: "bg-[#f08a8a] text-white hover:brightness-105",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-xl",
  md: "h-11 px-5 text-[0.95rem] rounded-xl",
  lg: "h-14 px-7 text-lg rounded-2xl",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold tracking-tight",
        "transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none",
        "cursor-pointer select-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex h-10 w-10 items-center justify-center rounded-xl",
      "text-fg/80 hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer",
      className,
    )}
    {...props}
  />
));
IconButton.displayName = "IconButton";
