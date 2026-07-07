import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ListPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWaitlist } from "./WaitlistProvider";
import { JoinWaitlistSheet } from "./JoinWaitlistSheet";
import type { JoinWaitlistInput } from "./types";

/**
 * Универсальная кнопка «Встать в очередь» — подставляется вместо
 * «Забронировать», когда ресурс полностью занят. Принимает generic input,
 * поэтому работает для ресторана, автомойки, клиники и т.д.
 */
export function WaitlistButton({
  input,
  className,
}: {
  input: JoinWaitlistInput;
  className?: string;
}) {
  const { join, isQueued } = useWaitlist();
  const [open, setOpen] = useState(false);
  const queued = isQueued(input.entityId);

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={queued}
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-semibold shadow-float transition-colors",
          queued ? "bg-emerald-500 text-white" : "bg-neutral-900 text-white",
          className,
        )}
      >
        {queued ? (
          <>
            <Check className="h-4 w-4" /> Вы в очереди
          </>
        ) : (
          <>
            <ListPlus className="h-4 w-4" /> Встать в очередь
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <JoinWaitlistSheet
            input={input}
            onClose={() => setOpen(false)}
            onConfirm={(inp) => {
              join(inp);
              setOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
