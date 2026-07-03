import { motion } from "framer-motion";

export function Splash() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-[100] flex items-center justify-center bg-white"
    >
      <motion.div
        initial={{ y: 10, opacity: 0, letterSpacing: "0.2em" }}
        animate={{ y: 0, opacity: 1, letterSpacing: "0em" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="text-6xl font-normal italic tracking-tight text-neutral-950"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Hostess
      </motion.div>
    </motion.div>
  );
}
