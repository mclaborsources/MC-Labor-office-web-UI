"use client";

import { useEffect } from "react";

/**
 * Temporarily makes the Access-parity placeholder controls interactive.
 * Real search/filter controls are excluded because their disabled state is
 * used while a route transition is running.
 */
export function CustomerPlaceholderControls() {
  useEffect(() => {
    function enablePlaceholders() {
      const roots = document.querySelectorAll(
        ".ac-customer-search-titlebar, .ac-customer-search-shell",
      );

      for (const root of roots) {
        const controls = root.querySelectorAll<
          HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >("button[disabled], input[disabled], input[readonly], select[disabled], textarea[readonly]");

        for (const control of controls) {
          if (control.closest(".ac-customer-search-filter-row-form")) continue;
          control.disabled = false;
          if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
            control.readOnly = false;
          }
        }
      }
    }

    enablePlaceholders();
    const observer = new MutationObserver(enablePlaceholders);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
