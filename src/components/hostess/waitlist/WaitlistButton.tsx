import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Check, ListPlus } from "lucide-react";
import { Button } from "../system";
import { useWaitlist } from "./WaitlistProvider";
import { JoinWaitlistSheet } from "./JoinWaitlistSheet";
import type { JoinWaitlistInput } from "./types";

/**
 * Replaces «Забронировать» when a resource is fully booked.
 * Generic input — works for restaurants, car washes, clinics, etc.
 */
export function WaitlistButton({
  input,
  className,
  label = "Встать в лист ожидания",
}: {
  input: JoinWaitlistInput;
  className?: string;
  label?: string;
}) {
  const { join, isQueued } = useWaitlist();
  const [open, setOpen] = useState(false);
  const queued = isQueued(input.entityId);

  return (
    <>
      <Button
        block
        size="lg"
        variant={queued ? "secondary" : "primary"}
        disabled={queued}
        onClick={() => setOpen(true)}
        className={queued ? `disabled:opacity-100 ${className ?? ""}` : className}
      >
        {queued ? (
          <>
            <Check className="h-4 w-4 text-live" strokeWidth={2} /> Вы в листе ожидания
          </>
        ) : (
          <>
            <ListPlus className="h-4 w-4" strokeWidth={1.6} /> {label}
          </>
        )}
      </Button>

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
