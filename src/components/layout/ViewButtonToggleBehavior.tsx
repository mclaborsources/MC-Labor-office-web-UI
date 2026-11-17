"use client";

import { useEffect } from "react";

// Match actual button-group containers, not larger panels whose names merely
// contain "views" (those can contain hundreds of unrelated controls).
const TOGGLE_GROUP = /(?:^|[-_])(?:views|presets?|view-buttons)$/i;

/** Adds pressed-state behavior to report/search view and preset button groups. */
export function ViewButtonToggleBehavior() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>("button");
      if (!button || button.disabled) return;

      const group = button.parentElement?.closest<HTMLElement>("[class]") ?? null;
      let viewGroup: HTMLElement | null = group;
      while (viewGroup && ![...viewGroup.classList].some(name => TOGGLE_GROUP.test(name))) {
        viewGroup = viewGroup.parentElement?.closest<HTMLElement>("[class]") ?? null;
      }
      if (!viewGroup) return;
      if (viewGroup.hasAttribute("data-managed-toggle")) return;

      const groupButtons = [...viewGroup.querySelectorAll<HTMLButtonElement>("button")]
        .filter(item => !item.disabled && !/^(clear filters|reset|save view|delete view)$/i.test(item.textContent?.trim() ?? ""));
      if (!groupButtons.includes(button)) return;
      groupButtons.forEach(item => { item.dataset.toggleButton = "true"; });
      const wasSelected = button.dataset.toggleSelected === "true";
      groupButtons.forEach(item => {
        const selected = item === button && !wasSelected;
        item.dataset.toggleSelected = String(selected);
        item.setAttribute("aria-pressed", String(selected));
      });
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
