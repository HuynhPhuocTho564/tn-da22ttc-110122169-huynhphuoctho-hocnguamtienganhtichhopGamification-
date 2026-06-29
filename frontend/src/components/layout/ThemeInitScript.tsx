"use client";

import { useEffect } from "react";

/**
 * ThemeInitScript — Inject theme-init script AFTER mount (client-side).
 *
 * Đây là giải pháp thay thế cho việc render <script> trong React tree
 * (gây React 19 warning "Scripts inside React components are never executed").
 *
 * Trade-off: script chạy SAU khi React hydrate → có thể gây FOUC (flash of unstyled content)
 * trong 1 frame. Để tránh FOUC, parent layout có thể render background màu hợp lý.
 */
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("linguaecho-theme");var s=window.matchMedia("(prefers-color-scheme: dark)").matches;var d=t?t==="dark":s;document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){document.documentElement.dataset.theme="light";}})();`;

export default function ThemeInitScript() {
  useEffect(() => {
    const script = document.createElement("script");
    script.textContent = THEME_INIT_SCRIPT;
    script.id = "theme-init";
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById("theme-init");
      if (el) el.remove();
    };
  }, []);
  return null;
}
