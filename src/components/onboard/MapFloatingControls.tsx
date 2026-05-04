import { useEffect, useState } from "react";
import { Crosshair, Layers } from "lucide-react";
import { ROUTES, ROUTE_ORDER } from "@/data/routes";
import { BOTTOM_NAV_HEIGHT } from "./BottomNav";

interface Props {
  onRecenter: () => void;
}

export const MapFloatingControls = ({ onRecenter }: Props) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const t = window.setTimeout(() => {
      window.addEventListener("pointerdown", close, { once: true });
    }, 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pointerdown", close);
    };
  }, [open]);

  const btnBase =
    "flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground shadow-lg transition-all hover:scale-105 active:scale-95";
  const btnStyle = {
    background: "hsl(var(--card) / 0.7)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
  };

  return (
    <>
      <div
        className="pointer-events-auto fixed right-4 z-[600] flex flex-col gap-2"
        style={{ bottom: BOTTOM_NAV_HEIGHT + 90 }}
      >
        <button
          aria-label="Show route legend"
          className={btnBase}
          style={btnStyle}
          onClick={(e) => {
            e.stopPropagation();
            if (navigator.vibrate) navigator.vibrate(20);
            setOpen((o) => !o);
          }}
        >
          <Layers className="h-5 w-5" />
        </button>
        <button
          aria-label="Recenter on nearest stop"
          className={btnBase}
          style={btnStyle}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(20);
            onRecenter();
          }}
        >
          <Crosshair className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div
          className="pointer-events-auto fixed left-1/2 z-[650] w-[min(92vw,360px)] -translate-x-1/2 animate-slide-up-in rounded-3xl border border-border p-4 shadow-2xl"
          style={{
            bottom: BOTTOM_NAV_HEIGHT + 90,
            background: "hsl(var(--card) / 0.85)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Route Legend
          </p>
          <ul className="flex flex-col gap-2">
            {ROUTE_ORDER.map((rid) => {
              const r = ROUTES[rid];
              return (
                <li key={rid} className="flex items-center gap-3">
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={{
                      backgroundColor: r.hex,
                      color: r.textOnTop === "white" ? "#fff" : "#000",
                    }}
                  >
                    {r.name}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {r.direction}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
};