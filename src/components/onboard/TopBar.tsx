import logo from "@/assets/onboard-logo.png";

export const TopBar = () => {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[600] flex justify-end px-4 pt-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur">
        <img src={logo} alt="Onboard logo" className="h-5 w-5" />
        <span className="text-sm font-extrabold tracking-tight text-black">
          Onboard
        </span>
      </div>
    </div>
  );
};
