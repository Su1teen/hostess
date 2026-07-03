import type { ReactNode } from "react";

/**
 * On mobile: full screen device.
 * On desktop: iPhone-like frame centered, so demo feels native.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-neutral-100 md:bg-gradient-to-br md:from-neutral-200 md:via-neutral-100 md:to-neutral-200">
      {/* Mobile: fills viewport */}
      <div className="relative mx-auto h-dvh w-full max-w-[430px] overflow-hidden bg-white md:hidden">
        {children}
      </div>

      {/* Desktop: phone frame */}
      <div className="hidden min-h-dvh items-center justify-center py-10 md:flex">
        <div className="relative">
          <div className="absolute -inset-8 rounded-[70px] bg-neutral-300/40 blur-3xl" />
          <div className="relative h-[900px] w-[420px] rounded-[56px] bg-neutral-950 p-[10px] shadow-[0_50px_120px_-20px_rgba(0,0,0,0.4)]">
            <div className="relative h-full w-full overflow-hidden rounded-[48px] bg-white">
              {/* Dynamic island */}
              <div className="pointer-events-none absolute left-1/2 top-2 z-50 h-7 w-28 -translate-x-1/2 rounded-full bg-black" />
              {children}
            </div>
          </div>
          <div className="mt-6 text-center text-xs font-medium uppercase tracking-[0.3em] text-neutral-500">
            Hostess · demo · Астана
          </div>
        </div>
      </div>
    </div>
  );
}
