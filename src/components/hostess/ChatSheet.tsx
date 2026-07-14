import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Sparkles, User, Bot } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export type MessageSender = "user" | "ai" | "host" | "guest";

export type Message = {
  id: string;
  sender: MessageSender;
  text: string;
  createdAt: number;
};

export function ChatSheet({
  open,
  onOpenChange,
  title,
  messages,
  onSend,
  placeholder = "Напишите сообщение...",
  emptyHint = "Начните диалог",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  messages: Message[];
  onSend: (text: string) => void;
  placeholder?: string;
  emptyHint?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const isMe = (sender: MessageSender) => sender === "user" || sender === "host";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[85%] flex-col rounded-t-[32px] p-0">
        <SheetHeader className="border-b border-border/60 px-5 py-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
            {title}
          </SheetTitle>
          <SheetDescription className="sr-only">{title}</SheetDescription>
        </SheetHeader>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-neutral-100"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.length === 0 && (
            <p className="py-10 text-center text-sm text-neutral-400">{emptyHint}</p>
          )}
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-end gap-2 ${isMe(m.sender) ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                    isMe(m.sender) ? "bg-primary text-white" : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {m.sender === "ai" || m.sender === "guest" ? (
                    <Bot className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <User className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isMe(m.sender) ? "bg-primary text-white" : "bg-neutral-100 text-neutral-900"
                  }`}
                >
                  {m.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <form
          className="flex items-center gap-2 border-t border-border/60 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem("message") as HTMLInputElement;
            const text = input.value.trim();
            if (!text) return;
            onSend(text);
            input.value = "";
          }}
        >
          <input
            name="message"
            type="text"
            placeholder={placeholder}
            className="min-w-0 flex-1 rounded-full border border-border/60 bg-background px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary"
            autoComplete="off"
          />
          <button
            type="submit"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-neutral-900 text-white"
            aria-label="Отправить"
          >
            <Send className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
