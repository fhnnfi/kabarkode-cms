"use client";

import { useEffect, useState } from "react";

/** True di macOS — dipakai untuk melabeli shortcut (⌘ vs Ctrl/Alt). */
export function useIsMac(): boolean {
  const [mac, setMac] = useState(false);
  useEffect(() => {
    setMac(/Mac|iPhone|iPad/i.test(navigator.platform ?? "") || /Mac OS X/i.test(navigator.userAgent));
  }, []);
  return mac;
}
