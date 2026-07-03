export const MAPBOX_TOKEN =
  "pk.eyJ1Ijoic3VsdGVlbiIsImEiOiJjbXI0bm52M3IwMGhrMnhyMG9vOTNydHl6In0.h2kO90ZY7BJ7lSQUKwsURA";

export const ASTANA = { lng: 71.4491, lat: 51.1694 };

export type Dish = {
  id: string;
  name: string;
  desc: string;
  price: number;
  weight: number;
  kcal: number;
  tags: string[];
  image: string;
  special?: string;
};

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  district: string;
  avgCheck: number;
  rating: number;
  reviews: number;
  distanceKm: number;
  cover: string;
  gallery: string[];
  coords: { lng: number; lat: number };
  description: string;
  tags: string[];
  menu: { section: string; items: Dish[] }[];
  specials: Dish[];
};

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const restaurants: Restaurant[] = [
  {
    id: "auyl",
    name: "Ауыл",
    cuisine: "Современная казахская",
    district: "Есиль, Астана",
    avgCheck: 18000,
    rating: 4.9,
    reviews: 1284,
    distanceKm: 1.2,
    cover: img("photo-1600891964599-f61ba0e24092"),
    gallery: [
      img("photo-1552566626-52f8b828add9"),
      img("photo-1544148103-0773bf10d330"),
      img("photo-1414235077428-338989a2e8c0"),
    ],
    coords: { lng: 71.4225, lat: 51.128 },
    description:
      "Авторская интерпретация казахской кухни от шефа Дидара. Дровяная печь, ферментация и локальные фермеры.",
    tags: ["Авторская", "Дровяная печь", "Wine bar"],
    menu: [
      {
        section: "Закуски",
        items: [
          {
            id: "d1",
            name: "Тартар из говядины «Актобе»",
            desc: "Мраморная говядина, перепелиный желток, дижон, копчёное масло",
            price: 6900,
            weight: 180,
            kcal: 310,
            tags: ["говядина", "сырое", "острое"],
            image: img("photo-1544025162-d76694265947"),
          },
          {
            id: "d2",
            name: "Баурсаки с трюфельным мёдом",
            desc: "Домашние баурсаки, крем-сыр, трюфельный мёд",
            price: 3200,
            weight: 140,
            kcal: 420,
            tags: ["выпечка", "вег"],
            image: img("photo-1509440159596-0249088772ff"),
          },
        ],
      },
      {
        section: "Горячее",
        items: [
          {
            id: "d3",
            name: "Бешбармак из ягнёнка",
            desc: "Томлёный ягнёнок 12 часов, тесто ручной раскатки, сорпа",
            price: 12400,
            weight: 520,
            kcal: 780,
            tags: ["ягнёнок", "традиция"],
            image: img("photo-1546069901-ba9599a7e63c"),
          },
          {
            id: "d4",
            name: "Судак на углях",
            desc: "Дикий судак, ферментированный перец, зелёное масло",
            price: 8900,
            weight: 320,
            kcal: 410,
            tags: ["рыба", "гриль"],
            image: img("photo-1519708227418-c8fd9a32b7a2"),
          },
        ],
      },
    ],
    specials: [
      {
        id: "s1",
        name: "Дегустационный сет шефа",
        desc: "7 подач + сомелье-пейринг",
        price: 34000,
        weight: 0,
        kcal: 0,
        tags: ["сет", "wine"],
        image: img("photo-1414235077428-338989a2e8c0"),
        special: "−25%",
      },
      {
        id: "s2",
        name: "Бранч по выходным",
        desc: "Пн–Пт с 11:00 до 15:00",
        price: 9900,
        weight: 0,
        kcal: 0,
        tags: ["бранч"],
        image: img("photo-1533089860892-a7c6f0a88666"),
        special: "Комбо",
      },
    ],
  },
  {
    id: "line",
    name: "Line Brew",
    cuisine: "Стейк-хаус",
    district: "Байтерек, Астана",
    avgCheck: 25000,
    rating: 4.8,
    reviews: 942,
    distanceKm: 2.4,
    cover: img("photo-1552566626-52f8b828add9"),
    gallery: [img("photo-1467003909585-2f8a72700288"), img("photo-1600891964599-f61ba0e24092")],
    coords: { lng: 71.428, lat: 51.128 },
    description: "Легендарный стейк-хаус с собственной пивоварней и dry-aged камерой.",
    tags: ["Стейки", "Крафт", "Терраса"],
    menu: [
      {
        section: "Стейки",
        items: [
          {
            id: "l1",
            name: "Рибай Dry Aged 45 дней",
            desc: "Ангус, соль Малдон, костный мозг",
            price: 21500,
            weight: 400,
            kcal: 920,
            tags: ["говядина", "dry-aged"],
            image: img("photo-1558030006-450675393462"),
          },
        ],
      },
    ],
    specials: [
      {
        id: "sl1",
        name: "Стейк + бокал вина",
        desc: "Каждый будний вечер",
        price: 18900,
        weight: 0,
        kcal: 0,
        tags: [],
        image: img("photo-1558030006-450675393462"),
        special: "−20%",
      },
    ],
  },
  {
    id: "nedelka",
    name: "Неделька",
    cuisine: "Европейская",
    district: "Left Bank",
    avgCheck: 12000,
    rating: 4.7,
    reviews: 610,
    distanceKm: 0.8,
    cover: img("photo-1517248135467-4c7edcad34c4"),
    gallery: [img("photo-1550966871-3ed3cdb5ed0c"), img("photo-1414235077428-338989a2e8c0")],
    coords: { lng: 71.44, lat: 51.156 },
    description: "Уютное бистро с сезонным меню и лучшим завтраком в городе.",
    tags: ["Завтраки", "Бистро", "Вино"],
    menu: [
      {
        section: "Завтраки",
        items: [
          {
            id: "n1",
            name: "Эгг Бенедикт с лососем",
            desc: "Бриошь, голландский соус, укроп",
            price: 4900,
            weight: 260,
            kcal: 540,
            tags: ["яйца", "рыба"],
            image: img("photo-1608039755401-742074f0548d"),
          },
        ],
      },
    ],
    specials: [],
  },
  {
    id: "sadu",
    name: "Sadu",
    cuisine: "Паназиатская",
    district: "Хан Шатыр",
    avgCheck: 15000,
    rating: 4.6,
    reviews: 320,
    distanceKm: 3.1,
    cover: img("photo-1552566626-52f8b828add9"),
    gallery: [img("photo-1512058564366-18510be2db19")],
    coords: { lng: 71.408, lat: 51.132 },
    description: "Дим-самы, роботы-повара и коктейли на робате.",
    tags: ["Азия", "Коктейли"],
    menu: [],
    specials: [],
  },
];

export const friends = [
  { id: "f1", name: "Айгерим", avatar: img("photo-1494790108377-be9c29b29330", 200), lastSeen: "Ауыл · 2ч назад" },
  { id: "f2", name: "Данияр", avatar: img("photo-1500648767791-00dcc994a43e", 200), lastSeen: "Line Brew · вчера" },
  { id: "f3", name: "Мадина", avatar: img("photo-1438761681033-6461ffad8d80", 200), lastSeen: "Sadu · сейчас" },
  { id: "f4", name: "Ерлан", avatar: img("photo-1472099645785-5658abf4ff4e", 200), lastSeen: "Неделька · 3ч назад" },
  { id: "f5", name: "Асель", avatar: img("photo-1534528741775-53994a69daeb", 200), lastSeen: "дома" },
];

export const loyaltyCards = [
  { id: "c1", name: "Ауыл", tier: "Gold", points: 12480, gradient: "from-neutral-900 to-neutral-700" },
  { id: "c2", name: "Line Brew", tier: "Silver", points: 4210, gradient: "from-[#F97316] to-[#EA580C]" },
  { id: "c3", name: "Sadu", tier: "Black", points: 890, gradient: "from-zinc-800 to-black" },
];

export const upcomingActivities = [
  { id: "u1", title: "Ужин в Ауыл", when: "Сегодня · 20:00", guests: 4, place: "Ауыл" },
  { id: "u2", title: "День рождения Айгерим", when: "Сб · 19:30", guests: 8, place: "Line Brew" },
  { id: "u3", title: "Бранч с командой", when: "Вс · 12:00", guests: 6, place: "Неделька" },
];

export const history = [
  { id: "h1", place: "Sadu", when: "12 мая", sum: 24500 },
  { id: "h2", place: "Line Brew", when: "3 мая", sum: 41200 },
  { id: "h3", place: "Неделька", when: "28 апр", sum: 9800 },
];

export const calendarEvents: Record<number, { title: string; color: string }[]> = {
  1: [{ title: "Ужин", color: "#F97316" }],
  6: [{ title: "Бранч", color: "#FBBF24" }],
  8: [{ title: "Кофе с Данияром", color: "#EF4444" }],
  10: [{ title: "Ужин в Ауыл", color: "#F97316" }],
  14: [{ title: "Sadu takeover", color: "#8B5CF6" }],
  16: [
    { title: "Ужин с семьёй", color: "#F97316" },
    { title: "Дегустация вин", color: "#EAB308" },
  ],
  20: [{ title: "Line Brew", color: "#EF4444" }],
  22: [{ title: "День рождения Айгерим", color: "#EC4899" }],
  24: [{ title: "Бранч", color: "#F59E0B" }],
  28: [{ title: "Кофе", color: "#3B82F6" }],
};

export const money = (n: number) => `${n.toLocaleString("ru-RU")} ₸`;
