import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "toolbar" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "mc-btn-primary text-white border border-blue-600/50 shadow-sm shadow-blue-600/20",
  secondary:
    "bg-white/90 text-slate-700 hover:bg-white border border-slate-200/90 shadow-sm hover:shadow hover:border-slate-300",
  danger:
    "bg-gradient-to-b from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 border border-red-600/50 shadow-sm shadow-red-600/20",
  toolbar:
    "bg-slate-100/80 text-slate-600 hover:bg-white hover:text-slate-800 border border-slate-200/80 text-sm hover:shadow-sm",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100/80 border border-transparent",
};

export function Button({
  variant = "secondary",
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
