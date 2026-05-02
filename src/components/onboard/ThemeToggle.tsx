import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export const ThemeToggle = () => {
  const { resolvedTheme, toggle } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-all hover:scale-105 active:scale-95"
      style={{
        background: dark ? "hsla(0,0%,8%,0.55)" : "hsla(0,0%,100%,0.55)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderColor: dark ? "hsla(0,0%,100%,0.18)" : "hsla(0,0%,0%,0.08)",
        color: dark ? "white" : "black",
      }}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};