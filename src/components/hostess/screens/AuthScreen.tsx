import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";
import type { UserRole } from "../AuthContext";
import { Button, Photo } from "../system";

export function AuthScreen({ onLogin }: { onLogin: (role: Exclude<UserRole, null>) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative flex h-full flex-col bg-canvas"
    >
      <div className="relative flex-1 overflow-hidden">
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Photo
            src="https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=1200&q=80"
            className="h-full w-full"
            eager
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-canvas" />
        <p className="absolute inset-x-0 top-0 pt-safe text-center text-[15px] font-semibold tracking-[0.38em] text-white">
          <span className="inline-block pl-[0.38em] pt-4">HOSTESS</span>
        </p>
      </div>

      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="px-6 pb-[calc(var(--sab)+24px)]"
      >
        <p className="t-micro">Астана</p>
        <h1 className="t-display mt-3">
          Лучшие столы города —<br />
          <span className="text-ink-3">в одном касании.</span>
        </h1>
        <p className="t-body mt-3 text-ink-2">
          Бронирование, предзаказ и живая загрузка заведений в реальном времени.
        </p>

        <div className="mt-8 space-y-2.5">
          <Button block size="lg" onClick={() => onLogin("guest")}>
            Открыть Hostess
          </Button>
          <Button block size="lg" variant="secondary" onClick={() => onLogin("business")}>
            <Briefcase className="h-4 w-4" strokeWidth={1.6} /> Демо интерфейса заведения
          </Button>
        </div>
        <p className="mt-4 text-center text-[12px] text-ink-3">
          Личный кабинет доступен по защищённой ссылке WhatsApp
        </p>
      </motion.div>
    </motion.div>
  );
}
