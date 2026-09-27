import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, ConciergeBell, Mic, SquarePen } from "lucide-react";
import { restaurants, type Restaurant } from "@/data/hostess";
import { hapticSelect, hapticTick } from "@/lib/haptics";
import { Rating, SlotChips } from "@/components/hostess/cards";
import { Button, Chip, IconButton, LiveDot, LiveStatus, Photo, spring } from "@/components/hostess/system";
import { slotsFor } from "@/components/hostess/venue";

type Message = { id: string; role: "concierge" | "guest"; text: string; venueId?: string };

const suggestions = [
  "Ужин на двоих сегодня с видом на город",
  "Тихое место для деловой встречи",
  "Где отметить день рождения на 12 человек?",
  "Коктейли после полуночи",
];

const byId = (id: string) => restaurants.find((r) => r.id === id);

/** Lightweight intent routing for the concierge demo. */
function recommend(text: string): { venueId: string; reply: string } {
  const t = text.toLowerCase();
  if (/вид|панорам|свидан|романт|двоих/.test(t))
    return {
      venueId: "sadu",
      reply:
        "Для такого вечера — Selfie на 18 этаже Ritz-Carlton. Попрошу стол у окна: закат над Есилем начинается около девяти. Сегодня свободно в эти слоты:",
    };
  if (/встреч|делов|инвест|тих|переговор/.test(t))
    return {
      venueId: "kinza",
      reply:
        "Рекомендую Lou Lou на Достык: спокойная посадка в зале с бархатными диванами, внимательный сервис и хорошая винная карта. Могу закрепить угловой стол:",
    };
  if (/рожд|компан|12|праздн|банкет/.test(t))
    return {
      venueId: "line",
      reply:
        "Line Brew отлично подходит для большой компании — отдельный зал с витражами, стейки на живом огне и живая музыка. Для 12 гостей есть окна:",
    };
  if (/коктейл|ноч|бар|кальян|полуноч/.test(t))
    return {
      venueId: "marrakesh",
      reply:
        "После полуночи — Tangiers Lounge на Самал: авторская миксология и атмосфера особняка до 4 утра. Если хочется трансляцию матча — загляните в XOXO. Столы в Tangiers:",
    };
  if (/казах|национ|бешбармак|традиц/.test(t))
    return {
      venueId: "auyl",
      reply:
        "Qazaq Gourmet — высокая казахская кухня от Артема Канцева. Советую дегустационный сет. Ближайшие столы:",
    };
  if (/завтрак|кофе|вино|уют/.test(t))
    return {
      venueId: "nedelka",
      reply: "Eva Wine Cafe на Байтурсынова — comfort food, винотека и очень уютный свет. Свободно:",
    };
  return {
    venueId: "kinza",
    reply: "Вот место, которое точно понравится: Lou Lou — европейская эстетика и хлеб собственной пекарни. Свободные столы:",
  };
}

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
};

export function AIScreen({ onOpenRestaurant }: { onOpenRestaurant?: (r: Restaurant) => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = (value: string) => {
    const q = value.trim();
    if (!q || typing) return;
    hapticTick();
    setText("");
    setMessages((m) => [...m, { id: `g-${Date.now()}`, role: "guest", text: q }]);
    setTyping(true);
    const { venueId, reply } = recommend(q);
    timers.current.push(
      setTimeout(() => {
        setTyping(false);
        setMessages((m) => [...m, { id: `c-${Date.now()}`, role: "concierge", text: reply, venueId }]);
      }, 1300),
    );
  };

  const listen = () => {
    if (listening) return;
    hapticSelect();
    setListening(true);
    timers.current.push(
      setTimeout(() => {
        setListening(false);
        setText("Столик на двоих сегодня в 20:00 с видом на город");
      }, 2200),
    );
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    setMessages([]);
    setTyping(false);
    setText("");
  };

  const empty = messages.length === 0;

  return (
    <div className="relative flex h-full flex-col bg-canvas">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-3 pt-safe">
        <div className="flex items-center gap-3 pt-1">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white">
            <ConciergeBell className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </span>
          <div>
            <p className="text-[16px] font-semibold tracking-[-0.015em]">Консьерж</p>
            <p className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
              <LiveDot tone="live" pulse size={6} /> На связи 24/7
            </p>
          </div>
        </div>
        {!empty && <IconButton icon={SquarePen} label="Новый запрос" variant="stone" onClick={reset} />}
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5">
        <AnimatePresence initial={false}>
          {empty && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="pb-6 pt-10"
            >
              <p className="t-micro">Hostess Concierge</p>
              <h1 className="t-display mt-3">
                {greeting()}, Айгерим.
                <br />
                <span className="text-ink-3">Куда отправимся?</span>
              </h1>
              <p className="t-body mt-4 max-w-[320px] text-ink-2">
                Подберу стол, забронирую и предупрежу заведение о ваших пожеланиях — аллергиях, поводе,
                любимом месте.
              </p>
              <div className="mt-8 space-y-2.5">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={s}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => send(s)}
                    className="flex w-full items-center justify-between rounded-row bg-surface px-4 py-3.5 text-left text-[14.5px] shadow-hairline"
                  >
                    {s}
                    <ArrowUp className="h-4 w-4 rotate-45 text-ink-3" strokeWidth={1.6} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-5 pb-4 pt-4">
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className={m.role === "guest" ? "flex justify-end" : ""}
            >
              {m.role === "guest" ? (
                <p className="max-w-[80%] rounded-[22px] rounded-br-[8px] bg-ink px-4 py-3 text-[15px] leading-snug text-white">
                  {m.text}
                </p>
              ) : (
                <div>
                  <p className="t-body max-w-[92%] text-ink">{m.text}</p>
                  {m.venueId && byId(m.venueId) && (
                    <VenueSuggestion r={byId(m.venueId)!} onOpen={onOpenRestaurant} />
                  )}
                </div>
              )}
            </motion.div>
          ))}
          {typing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 py-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-ink"
                  style={{ animation: `hs-typing 1.1s ${i * 0.15}s infinite` }}
                />
              ))}
              <span className="ml-2 text-[12.5px] text-ink-3">Консьерж подбирает варианты</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="px-4 pb-[calc(var(--nav-h)+var(--nav-gap)+var(--sab)+12px)] pt-2">
        {!empty && (
          <div className="rail -mx-4 mb-2.5 gap-2">
            {suggestions.map((s) => (
              <Chip key={s} tone="outline" onClick={() => send(s)}>
                {s}
              </Chip>
            ))}
          </div>
        )}
        <div className="flex h-14 items-center gap-2 rounded-[22px] bg-surface pl-4 pr-2 shadow-float">
          <AnimatePresence mode="wait" initial={false}>
            {listening ? (
              <motion.div
                key="wave"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 items-center gap-3"
              >
                <span className="flex h-6 items-center gap-[3px]">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="w-[3px] rounded-full bg-ink"
                      animate={{ height: [4, 8 + ((i * 7) % 16), 4] }}
                      transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.05, ease: "easeInOut" }}
                    />
                  ))}
                </span>
                <span className="text-[14px] text-ink-3">Слушаю…</span>
              </motion.div>
            ) : (
              <motion.input
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(text)}
                placeholder="Опишите вечер, который хотите"
                enterKeyHint="send"
                className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-3"
              />
            )}
          </AnimatePresence>
          <AnimatePresence mode="popLayout" initial={false}>
            {text.trim() ? (
              <motion.div key="send" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={spring}>
                <IconButton icon={ArrowUp} label="Отправить" variant="ink" onClick={() => send(text)} />
              </motion.div>
            ) : (
              <motion.div key="mic" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={spring}>
                <IconButton
                  icon={Mic}
                  label="Голосовой запрос"
                  variant={listening ? "ink" : "stone"}
                  onClick={listen}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function VenueSuggestion({ r, onOpen }: { r: Restaurant; onOpen?: (r: Restaurant) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, ...spring }}
      className="mt-4 overflow-hidden rounded-hero bg-surface shadow-soft"
    >
      <button type="button" onClick={() => onOpen?.(r)} className="block w-full text-left">
        <Photo src={r.cover} className="aspect-[16/9] w-full" />
        <div className="px-4 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="t-micro">{r.cuisine}</p>
              <p className="mt-1 truncate text-[19px] font-semibold tracking-[-0.02em]">{r.name}</p>
            </div>
            <Rating value={r.rating} className="pt-4" />
          </div>
          <p className="mt-1 truncate text-[13px] text-ink-2">
            {r.district} · {r.distanceKm} км
          </p>
          <LiveStatus occupancy={r.occupancy} className="mt-2.5" showPercent={false} />
        </div>
      </button>
      <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-4">
        <SlotChips slots={slotsFor(r.id, r.occupancy)} onPick={() => onOpen?.(r)} />
        <Button size="sm" variant="secondary" onClick={() => onOpen?.(r)}>
          Открыть
        </Button>
      </div>
    </motion.div>
  );
}
