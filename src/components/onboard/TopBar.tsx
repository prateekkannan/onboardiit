import logo from "@/assets/onboard-logo.png";
import { useTheme } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";

export const TopBar = () => {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[600] flex items-center justify-between px-4 pt-4">
      <div
        className="pointer-events-auto flex animate-fade-in items-center gap-2 rounded-full border px-3.5 py-1.5 shadow-sm"
        style={{
          background: dark ? "hsla(0,0%,8%,0.55)" : "hsla(0,0%,100%,0.45)",
          borderColor: dark ? "hsla(0,0%,100%,0.18)" : "hsla(0,0%,100%,0.5)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          color: dark ? "white" : "black",
        }}
      >
        <img src={logo} alt="Onboard logo" className="h-5 w-5" />
        <span className="text-sm tracking-tight">
          <span className="font-extrabold">Onboard</span>
          <span className="mx-1.5 opacity-50">|</span>
          <span className="font-normal">IIT Madras Shuttle Bus</span>
        </span>
      </div>
      <ThemeToggle />
    </div>
  );
};
