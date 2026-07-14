import { motion } from "framer-motion";
import { UserRound, Briefcase } from "lucide-react";
import type { UserRole } from "../AuthContext";

export function AuthScreen({ onLogin }: { onLogin: (role: Exclude<UserRole, null>) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="flex h-full flex-col items-center justify-center px-6"
    >
      <div className="text-center">
        <h1 className="text-4xl tracking-[-0.04em]">Hostess</h1>
        <p className="mt-2 text-sm text-neutral-500">Super App · Астана</p>
      </div>

      <div className="mt-10 w-full max-w-sm space-y-3">
        <button
          type="button"
          onClick={() => onLogin("guest")}
          className="flex w-full items-center justify-center gap-3 rounded-[28px] bg-neutral-900 py-4 text-sm font-medium text-white shadow-float transition-transform active:scale-[0.98]"
        >
          <UserRound className="h-5 w-5" strokeWidth={1.5} />
          Войти как Гость
        </button>

        <button
          type="button"
          onClick={() => onLogin("business")}
          className="flex w-full items-center justify-center gap-3 rounded-[28px] border-2 border-neutral-900 bg-white py-4 text-sm font-medium text-neutral-900 transition-transform active:scale-[0.98]"
        >
          <Briefcase className="h-5 w-5" strokeWidth={1.5} />
          Войти как Хостес (Бизнес)
        </button>
      </div>

      <p className="mt-8 text-center text-[11px] text-neutral-400">
        Нажмите на удобную роль — данные не требуются.
      </p>
    </motion.div>
  );
}
