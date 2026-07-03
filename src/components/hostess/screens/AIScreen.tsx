import { Sparkles, Send, Mic, Star, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";

const suggestions = [
  "Забронируй ужин на двоих сегодня, что-то с террасой",
  "Романтический вечер на выходных",
  "Где отметить день рождения на 12 человек?",
  "Нужен ресторан рядом с Байтереком до 20 000 ₸",
];

const messages: { role: "ai" | "user"; text: string; card?: boolean }[] = [
  {
    role: "ai",
    text: "Привет! Я ваш AI-консьерж Hostess. Подберу идеальное место, забронирую столик и напомню о брони. Что ищете?",
  },
  {
    role: "user",
    text: "Найди тихое место для встречи с инвесторами через час, где подают стейки.",
  },
  {
    role: "ai",
    text: "Отличный выбор. Нашёл идеальный вариант — Line Brew: приватная зона, dry-aged стейки, тихая атмосфера. Есть свободный кабинет на 19:00.",
    card: true,
  },
];

export function AIScreen() {
  return (
    <div className="relative flex h-full flex-col bg-gradient-to-b from-white via-white to-neutral-50">
      <div className="px-5 pb-4 pt-14">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Hostess AI</h1>
            <p className="text-xs text-neutral-500">Личный консьерж · онлайн</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-4">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-md bg-neutral-900 text-white"
                  : "rounded-bl-md bg-white text-neutral-900 hairline"
              }`}
            >
              {m.text}
            </div>
          </motion.div>
        ))}

        {/* Restaurant card from AI */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-3xl bg-white p-3 hairline"
        >
          <div className="relative h-36 w-full overflow-hidden rounded-2xl">
            <img
              src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"
              className="h-full w-full object-cover"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute inset-x-3 bottom-3 text-white">
              <p className="text-lg font-semibold">Line Brew</p>
              <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-white" /> 4.8
                </span>
                <span>· Стейк-хаус</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 px-1 text-[11px] text-neutral-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Кабинет свободен в 19:00
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> 2.4 км
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20">
              Забронировать стол в 19:00
            </button>
            <button className="rounded-full bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-700">
              Ещё
            </button>
          </div>
        </motion.div>
      </div>

      <div className="px-5 pb-2">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
          {suggestions.map((s) => (
            <button
              key={s}
              className="shrink-0 rounded-full bg-neutral-100 px-3.5 py-2 text-xs text-neutral-700"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-[140px]">
        <div className="flex items-center gap-2 rounded-full bg-white p-1.5 pl-4 hairline shadow-sm">
          <input
            placeholder="Спросите что угодно…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
          <button className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100">
            <Mic className="h-4 w-4" />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
