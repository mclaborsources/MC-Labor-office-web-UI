import type { LucideIcon } from "lucide-react";

type IconSize = "xs" | "sm" | "md" | "lg";

const sizes: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
};

interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
}

export function Icon({ icon: LucideIconComponent, size = "sm", className = "" }: IconProps) {
  return (
    <LucideIconComponent
      size={sizes[size]}
      className={`shrink-0 ${className}`}
      aria-hidden
    />
  );
}
