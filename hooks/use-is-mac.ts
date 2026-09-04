"use client";

import { useState } from "react";

/** True di macOS — dipakai untuk melabeli shortcut (⌘ vs Ctrl/Alt). */
export function useIsMac(): boolean {
  // Lazy initializer: dihitung sekali saat mount di browser (komponen ini
  // selalu client; tidak ada setState di dalam effect).
  const [mac] = useState(
    () =>
      typeof navigator !== "undefined" &&
      (/Mac|iPhone|iPad/i.test(navigator.platform ?? "") || /Mac OS X/i.test(navigator.userAgent)),
  );
  return mac;
}
