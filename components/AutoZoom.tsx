"use client";

import { useEffect } from "react";

export default function AutoZoom() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth <= 768;
      const zoomLevel = isMobile ? 1.0 : 0.8;

      // Apply CSS zoom to scale the entire page down by 20%
      // @ts-ignore
      document.documentElement.style.zoom = `${zoomLevel * 100}%`;

      // Set the --zoom-level CSS variable so height formulas like
      // calc(100vh / var(--zoom-level)) correctly fill the zoomed viewport
      document.documentElement.style.setProperty("--zoom-level", String(zoomLevel));

      // Also make the empty-section (scroll spacer) match the hero height
      const emptySection = document.querySelector(".empty-section") as HTMLElement;
      if (emptySection) {
        emptySection.style.height = `calc(100vh / ${zoomLevel})`;
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        // @ts-ignore
        document.documentElement.style.zoom = "100%";
        document.documentElement.style.setProperty("--zoom-level", "1");

        const emptySection = document.querySelector(".empty-section") as HTMLElement;
        if (emptySection) {
          emptySection.style.height = "";
        }
      }
    };
  }, []);

  return null;
}
