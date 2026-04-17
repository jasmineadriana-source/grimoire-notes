import { useEffect } from "react";
import { useApp } from "./store";

/** Applies the current theme to <html data-theme="..."> */
export function ThemeBridge() {
  const theme = useApp((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
  }, [theme]);
  return null;
}
