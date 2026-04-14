"use client";

import { useEffect } from "react";

export function ReceiptPrintMode() {
  useEffect(() => {
    document.documentElement.classList.add("receipt-print-mode");
    document.body.classList.add("receipt-print-mode");

    return () => {
      document.documentElement.classList.remove("receipt-print-mode");
      document.body.classList.remove("receipt-print-mode");
    };
  }, []);

  return null;
}
