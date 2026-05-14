import { useState } from "react";
import { ChevronDown, MapPin, Navigation, X } from "lucide-react";
import { STOPS, type Stop } from "@/data/stops";
import { useTheme } from "@/components/theme/ThemeProvider";

export interface JourneyPlannerProps {
  fromStop: Stop;
  toStop: Stop | null;
  onChangeFrom: (s: Stop) => void;
  onChangeTo: (s: Stop | null) => void;
  isFromAuto: boolean;
}

type OpenPicker = "from" | "to" | null;

export const JourneyPlanner = ({
  fromStop,
  toStop,
  onChangeFrom,
  onChangeTo,
  isFromAuto,
}: JourneyPlannerProps) => {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const [open, setOpen] = useState<OpenPicker>(null);

  const cardStyle = {
    background: dark ? "hsla(0,0%,8%,0.55)" : "hsla(0,0%,100%,0.55)",
    borderColor: dark ? "hsla(0,0%,100%,0.18)" : "hsla(0,0%,100%,0.6)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
  } as const;

  return (
    <div
      className="pointer-events-auto fixed left-3 top-[64px] z-[600] w-[min(78vw,260px)] animate-fade-in rounded-2xl border p-2 shadow-lg"
      style={cardStyle}
    >
      <Row
        label="From"
        icon={<MapPin className="h-3.5 w-3.5" />}
        value={fromStop.name}
        hint={isFromAuto ? "Live · nearest" : undefined}
        onClick={() => setOpen((o) => (o === "from" ? null : "from"))}
        active={open === "from"}
      />
      <div className="mx-2 my-1 h-px bg-foreground/10" />
      <Row
        label="To"
        icon={<Navigation className="h-3.5 w-3.5" />}
        value={toStop?.name ?? "Choose destination"}
        muted={!toStop}
        onClick={() => setOpen((o) => (o === "to" ? null : "to"))}
        active={open === "to"}
        trailing={
          toStop ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChangeTo(null);
              }}
              className="ml-1 rounded-full p-1 text-foreground/60 hover:bg-foreground/10"
              aria-label="Clear destination"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null
        }
      />

      {open && (
        <div
          className="mt-2 max-h-[44vh] overflow-y-auto rounded-xl border border-foreground/10 bg-background/80 no-scrollbar"
          style={{
            backdropFilter: "blur(16px) saturate(180%)",
            WebkitBackdropFilter: "blur(16px) saturate(180%)",
          }}
        >
          {STOPS.map((s) => {
            const selected =
              open === "from" ? s.id === fromStop.id : s.id === toStop?.id;
            const disabled =
              (open === "from" && s.id === toStop?.id) ||
              (open === "to" && s.id === fromStop.id);
            return (
              <button
                key={s.id}
                disabled={disabled}
                onClick={() => {
                  if (open === "from") onChangeFrom(s);
                  else onChangeTo(s);
                  setOpen(null);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-[12px] transition-colors ${
                  disabled
                    ? "cursor-not-allowed opacity-40"
                    : "hover:bg-foreground/5"
                } ${selected ? "font-semibold text-foreground" : "text-foreground/80"}`}
              >
                <span className="truncate">{s.name}</span>
                {selected && (
                  <span className="ml-2 h-1.5 w-1.5 rounded-full bg-foreground" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

function Row({
  label,
  icon,
  value,
  hint,
  muted,
  active,
  onClick,
  trailing,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  hint?: string;
  muted?: boolean;
  active?: boolean;
  onClick: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors ${
        active ? "bg-foreground/10" : "hover:bg-foreground/5"
      }`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[9px] font-bold uppercase tracking-wider text-foreground/55">
          {label}
          {hint && (
            <span className="ml-1 normal-case tracking-normal text-foreground/45">
              · {hint}
            </span>
          )}
        </span>
        <span
          className={`block truncate text-[12px] font-semibold ${
            muted ? "text-foreground/50" : "text-foreground"
          }`}
        >
          {value}
        </span>
      </span>
      {trailing}
      <ChevronDown
        className={`h-3.5 w-3.5 shrink-0 text-foreground/50 transition-transform ${
          active ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}