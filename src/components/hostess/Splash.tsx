import { motion } from "framer-motion";

export function Splash() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-canvas"
    >
      <motion.p
        initial={{ opacity: 0, letterSpacing: "0.6em" }}
        animate={{ opacity: 1, letterSpacing: "0.38em" }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="pl-[0.38em] text-[22px] font-semibold text-ink"
      >
        HOSTESS
      </motion.p>
      <motion.span
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.25, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 h-px w-10 origin-center bg-ink/30"
      />
    </motion.div>
  );
}
