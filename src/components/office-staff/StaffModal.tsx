"use client";
import { useEffect, useRef, type ReactNode } from "react";

export function StaffModal({ children, titleId, busy, onClose, small = false }: { children: ReactNode; titleId: string; busy: boolean; onClose: () => void; small?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className={`staff-edit-dialog staff-native-dialog${small ? " staff-password-dialog" : ""}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>{children}</dialog>;
}
