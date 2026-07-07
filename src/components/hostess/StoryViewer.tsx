import { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { Story } from "@/data/hostess";

/**
 * Просмотр сторис — полноэкранный оверлей с автозакрытием через 4 секунды.
 * Извлечён из MapScreen/CatalogScreen для переиспользования.
 */
export function StoryViewer({ story, onClose }: { story: Story; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black"
      onClick={onClose}
    >
      <img src={story.cover} alt="" className="h-full w-full object-cover opacity-90" />
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-4 pt-12">
        {/* Прогресс-бар */}
        <div className="mb-3 h-0.5 w-full overflow-hidden rounded-full bg-white/25">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4, ease: "linear" }}
            className="h-full bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <img
            src={story.avatar}
            alt=""
            className="h-8 w-8 rounded-full object-cover ring-2 ring-white/60"
          />
          <p className="text-sm font-semibold text-white">{story.name}</p>
          <button onClick={onClose} className="ml-auto text-white/80" aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <p className="absolute inset-x-6 bottom-24 text-center text-lg font-semibold text-white drop-shadow">
        {story.caption}
      </p>
    </motion.div>
  );
}
