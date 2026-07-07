import { motion } from "framer-motion";
import { Clock, Users, X, ListPlus } from "lucide-react";
import { hapticSelect } from "@/lib/haptics";
import type { JoinWaitlistInput } from "./types";

/**
 * Онбординг очереди: подтверждение перед входом.
 * Показывает ориентировочное время ожидания и число людей впереди.
 * Generic — работает для любого типа заведения через props.
 */
export function JoinWaitlistSheet({
  input,
  onClose,
  onConfirm,
}: {
  input: JoinWaitlistInput;
  onClose: () => void;
  onConfirm: (input: JoinWaitlistInput) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[120] flex items-end bg-black/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[32px] bg-white pb-8 shadow-float"
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
              <ListPlus className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-neutral-500">Очередь</p>
              <p className="text-sm font-semibold">{input.entityName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 px-5 pt-5">
          <div className="rounded-[24px] border border-border/60 bg-neutral-50 p-4">
            <Clock className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-semibold tracking-tight">~{input.etaMin} мин</p>
            <p className="text-[11px] text-neutral-500">Ориентировочное ожидание</p>
          </div>
          <div className="rounded-[24px] border border-border/60 bg-neutral-50 p-4">
            <Users className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-semibold tracking-tight">{input.peopleAhead}</p>
            <p className="text-[11px] text-neutral-500">Человек перед вами</p>
          </div>
        </div>

        <p className="px-5 pt-4 text-xs leading-relaxed text-neutral-500">
          Мы уведомим вас, как только освободится место. У вас будет 5 минут, чтобы подтвердить.
          Очередь можно покинуть в любой момент.
        </p>

        <div className="px-5 pt-5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              hapticSelect();
              onConfirm(input);
            }}
            className="w-full rounded-full bg-neutral-900 py-4 text-sm font-semibold text-white shadow-float"
          >
            Подтвердить и встать в очередь
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
