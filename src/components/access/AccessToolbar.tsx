import type { ReactNode } from "react";

interface AccessToolbarProps {
  children: ReactNode;
  className?: string;
}

/** A dense gray Access toolbar band that wraps command buttons / fields. */
export function AccessToolbar({ children, className = "" }: AccessToolbarProps) {
  return <div className={`ac-toolbar ${className}`}>{children}</div>;
}

interface AccessButtonRowProps {
  children: ReactNode;
  className?: string;
}

/** Inline row of Access buttons / controls. */
export function AccessButtonRow({ children, className = "" }: AccessButtonRowProps) {
  return <div className={`flex flex-wrap items-center gap-1 ${className}`}>{children}</div>;
}

/** Thin vertical divider used between toolbar groups. */
export function AccessToolbarDivider() {
  return <span className="mx-1 h-5 w-px bg-[#bcbcbc]" aria-hidden />;
}
