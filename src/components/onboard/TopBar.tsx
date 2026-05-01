import logo from "@/assets/onboard-logo.png";

export const TopBar = () => {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[600] flex justify-start px-4 pt-4">
      <div
        className="pointer-events-auto flex animate-fade-in items-center gap-2 rounded-full border border-white/40 px-3.5 py-1.5 shadow-sm"
        style={{
          background: "hsla(0, 0%, 100%, 0.35)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
      >
        <img src={logo} alt="Onboard logo" className="h-5 w-5" />
        <span className="text-sm tracking-tight text-black">
          <span className="font-extrabold">Onboard</span>
          <span className="mx-1.5 text-black/40">|</span>
          <span className="font-normal">IIT Madras Shuttle Bus</span>
        </span>
      </div>
    </div>
  );
};
