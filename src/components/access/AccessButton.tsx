import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

type AccessButtonVariant = "default" | "warn" | "go" | "primary";

interface AccessButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AccessButtonVariant;
  icon?: LucideIcon;
  xs?: boolean;
}

const variantClass: Record<AccessButtonVariant, string> = {
  default: "",
  warn: "ac-btn-warn",
  go: "ac-btn-go",
  primary: "ac-btn-primary",
};

/** Small, rectangular Access-style command button. */
export function AccessButton({
  variant = "default",
  icon,
  xs = false,
  className = "",
  children,
  type = "button",
  ...props
}: AccessButtonProps) {
  return (
    <button
      type={type}
      className={`ac-btn ${variantClass[variant]} ${xs ? "ac-btn-xs" : ""} ${className}`}
      {...props}
    >
      {icon && <Icon icon={icon} size="xs" />}
      {children}
    </button>
  );
}
