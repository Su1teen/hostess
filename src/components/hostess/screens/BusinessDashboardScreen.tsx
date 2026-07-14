import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, XCircle, ChefHat, Star, Clock, Calendar, Sparkles } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BentoCard } from "../Bento";
import { ChatSheet, type Message } from "../ChatSheet";

const revenueData = [
  { day: "Пн", revenue: 380000 },
  { day: "Вт", revenue: 420000 },
  { day: "Ср", revenue: 390000 },
  { day: "Чт", revenue: 510000 },
  { day: "Пт", revenue: 620000 },
  { day: "Сб", revenue: 710000 },
  { day: "Вс", revenue: 540000 },
];

const hourlyData = [
  { hour: "12", orders: 4 },
  { hour: "14", orders: 8 },
  { hour: "16", orders: 12 },
  { hour: "18", orders: 18 },
  { hour: "20", orders: 24 },
  { hour: "22", orders: 16 },
  { hour: "00", orders: 6 },
];

const categoryData = [
  { name: "khinkali", label: "Хинкали", value: 35, fill: "var(--color-khinkali)" },
  { name: "khachapuri", label: "Хачапури", value: 25, fill: "var(--color-khachapuri)" },
  { name: "wine", label: "Вино", value: 20, fill: "var(--color-wine)" },
  { name: "main", label: "Горячее", value: 20, fill: "var(--color-main)" },
];

const revenueConfig = {
  revenue: { label: "Выручка", color: "var(--primary)" },
};

const hourlyConfig = {
  orders: { label: "Заказы", color: "var(--primary)" },
};

const categoryConfig = {
  khinkali: { label: "Хинкали", color: "#f97316" },
  khachapuri: { label: "Хачапури", color: "#facc15" },
  wine: { label: "Вино", color: "#a855f7" },
  main: { label: "Горячее", color: "#22c55e" },
};

const insights = [
  {
    label: "Выручка",
    value: "4,500,000 ₸",
    sub: "+12% к прошлому месяцу",
    icon: TrendingUp,
    tone: "text-neutral-900",
  },
  { label: "Загрузка", value: "78%", sub: "Пик в 20:00", icon: Clock, tone: "text-primary" },
  { label: "Отмены", value: "3%", sub: "2 заявки сегодня", icon: XCircle, tone: "text-red-500" },
  {
    label: "Топ-блюдо",
    value: "Хинкали",
    sub: "142 порции",
    icon: ChefHat,
    tone: "text-neutral-900",
  },
  { label: "Гости", value: "142", sub: "68 новых", icon: Users, tone: "text-neutral-900" },
  {
    label: "Средний чек",
    value: "12,400 ₸",
    sub: "+5% неделя",
    icon: Star,
    tone: "text-neutral-900",
  },
  { label: "Новые брони", value: "8", sub: "3 VIP", icon: Calendar, tone: "text-neutral-900" },
  {
    label: "Очередь",
    value: "4",
    sub: "Среднее ожидание 12 мин",
    icon: Clock,
    tone: "text-neutral-900",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function money(n: number) {
  return `${n.toLocaleString("ru-RU")} ₸`;
}

function aiResponse(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("выручка") || t.includes("деньги") || t.includes("доход")) {
    return "Выручка составила 4,500,000 ₸, это на 12% больше прошлого месяца.";
  }
  if (t.includes("загрузка") || t.includes("зал")) {
    return "Загрузка зала сегодня 78%. Пиковое время — 20:00.";
  }
  if (t.includes("блюдо") || t.includes("хинкали") || t.includes("топ")) {
    return "Топ-блюдо месяца — Хинкали Калакури. Продано 142 порции.";
  }
  if (t.includes("отмена") || t.includes("отмены")) {
    return "Отмены сегодня — 3%, всего 2 заявки.";
  }
  return "Я понял. Уточните, какой аналитикой вас интересует: выручка, загрузка, топ-блюда или отмены?";
}

export function BusinessDashboardScreen() {
  const [aiOpen, setAiOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "ai-1",
      sender: "ai",
      text: "Здравствуйте! Я ИИ-аналитик. Спросите меня о выручке, загрузке или топ-блюдах.",
      createdAt: Date.now(),
    },
  ]);

  const sendMessage = (text: string) => {
    const userId = `user-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userId, sender: "user", text, createdAt: Date.now() }]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: aiResponse(text),
          createdAt: Date.now(),
        },
      ]);
    }, 800);
  };

  return (
    <>
      <motion.div
        initial="hidden"
        animate="show"
        variants={container}
        className="h-full overflow-y-auto overscroll-none bg-gray-50 px-5 pb-[calc(140px+env(safe-area-inset-bottom)+16px)] pt-14"
      >
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-neutral-500">Аналитика</p>
            <h1 className="text-2xl tracking-tight">Дашборд</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-500">Сегодня</p>
            <p className="text-lg font-semibold">{money(4500000)}</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="mt-5 grid grid-cols-2 gap-3">
          {insights.map((ins) => (
            <BentoCard key={ins.label} className="text-left">
              <div className="flex items-start justify-between">
                <ins.icon className={`h-5 w-5 ${ins.tone}`} strokeWidth={1.5} />
              </div>
              <p className="mt-3 text-[11px] text-neutral-500">{ins.label}</p>
              <p className="text-lg font-semibold">{ins.value}</p>
              <p className="text-[11px] text-neutral-400">{ins.sub}</p>
            </BentoCard>
          ))}
        </motion.div>

        <motion.div variants={item} className="mt-4">
          <BentoCard>
            <p className="mb-3 text-sm font-semibold">Выручка по дням</p>
            <ChartContainer config={revenueConfig} className="h-[200px] w-full">
              <LineChart data={revenueData}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </BentoCard>
        </motion.div>

        <motion.div variants={item} className="mt-4">
          <BentoCard>
            <p className="mb-3 text-sm font-semibold">Заказы по часам</p>
            <ChartContainer config={hourlyConfig} className="h-[200px] w-full">
              <BarChart data={hourlyData}>
                <XAxis dataKey="hour" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </BentoCard>
        </motion.div>

        <motion.div variants={item} className="mt-4">
          <BentoCard>
            <p className="mb-3 text-sm font-semibold">Структура заказов</p>
            <ChartContainer config={categoryConfig} className="h-[220px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" hideIndicator />} />
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </BentoCard>
        </motion.div>
      </motion.div>

      <motion.button
        type="button"
        onClick={() => setAiOpen(true)}
        whileTap={{ scale: 0.95 }}
        className="pointer-events-auto absolute bottom-[calc(80px+env(safe-area-inset-bottom)+16px)] right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-neutral-900 text-white shadow-float"
        aria-label="ИИ-Аналитика"
      >
        <Sparkles className="h-5 w-5" strokeWidth={1.5} />
      </motion.button>

      <ChatSheet
        open={aiOpen}
        onOpenChange={setAiOpen}
        title="ИИ-Аналитика"
        messages={messages}
        onSend={sendMessage}
        placeholder="Например: выручка за месяц"
      />
    </>
  );
}
