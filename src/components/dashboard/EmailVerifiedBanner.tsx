"use client";

import { useState } from "react";
import { CheckCircle, X } from "lucide-react";

export function EmailVerifiedBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      className="mb-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3"
      role="alert"
    >
      <div className="flex items-center gap-2">
        <CheckCircle className="size-5 shrink-0 text-green-600" aria-hidden="true" />
        <p className="font-body text-sm text-green-800">
          Deine E-Mail-Adresse wurde erfolgreich bestätigt. Willkommen!
        </p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="ml-4 text-green-600 hover:text-green-800"
        aria-label="Meldung schließen"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
