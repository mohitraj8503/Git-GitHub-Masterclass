"use client";

import { useEffect } from "react";

export default function WebflowClasses() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("w-mod-js");
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      root.classList.add("w-mod-touch");
    }
  }, []);

  return null;
}
