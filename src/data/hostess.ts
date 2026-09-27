export const MAPBOX_TOKEN =
  "pk.eyJ1Ijoic3VsdGVlbiIsImEiOiJjbHVqbWJtYWkwNXhiMmxvMWwxOW9kZG9sIn0.8aHVOkgsFBDYnN9FBVNcPw";

export const ASTANA = { lng: 71.4491, lat: 51.1694 };

/** Demo user location (Left Bank). All distances derive from it. */
export const USER_LOCATION = { lng: 71.4232, lat: 51.1226 };

export function distanceKm(c: { lng: number; lat: number }, from = USER_LOCATION): number {
  const rad = Math.PI / 180;
  const dLat = (c.lat - from.lat) * rad;
  const dLng = (c.lng - from.lng) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * rad) * Math.cos(c.lat * rad) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(a)) * 10) / 10;
}

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
  ingredients?: string[];
  protein?: number;
  fat?: number;
  carbs?: number;
};

/**
 * Live / "now" ambience media (Atmosfy-style). Not CCTV — a short muted
 * ambience clip or stream from the venue. `isLive` = continuous stream;
 * otherwise it's a recent clip and the UI shows its age instead of LIVE.
 */
export type LiveMedia = {
  src: string;
  poster: string;
  isLive: boolean;
  /** Minutes since the feed/clip was last updated. */
  updatedMin: number;
  source?: string;
};

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  district: string;
  address?: string;
  hours?: string;
  avgCheck: number;
  rating: number;
  reviews: number;
  distanceKm: number;
  occupancy: number;
  peakHours: string;
  cover: string;
  gallery: string[];
  coords: { lng: number; lat: number };
  description: string;
  tags: string[];
  menu: { section: string; items: Dish[] }[];
  specials: Dish[];
  live?: LiveMedia;
};

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const restaurants: Restaurant[] = [
  {
    id: "auyl",
    name: "Qazaq Gourmet",
    cuisine: "Высокая казахская кухня",
    district: "Есиль",
    address: "пр. Мангилик Ел, 29",
    hours: "12:00 – 00:00",
    avgCheck: 18000,
    rating: 4.9,
    reviews: 1284,
    distanceKm: 1.2,
    occupancy: 72,
    peakHours: "19:00 – 22:00",
    cover: img("photo-1578474846511-04ba529f0b88"),
    gallery: [
      img("photo-1578474846511-04ba529f0b88"),
      img("photo-1414235077428-338989a2e8c0"),
      img("photo-1517248135467-4c7edcad34c4"),
    ],
    coords: { lng: 71.4336, lat: 51.1182 },
    description:
      "Бренд-шеф Артем Канцев переосмысляет гастрономическое наследие регионов Казахстана: сезонные локальные продукты, современные техники и интерьер, в котором читаются узоры кочевой культуры.",
    tags: ["Авторская", "Локальные продукты", "Дегустационный сет"],
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
            tags: ["говядина", "сырое", "острое 🌶"],
            image: img("photo-1544025162-d76694265947"),
            ingredients: [
              "мраморная говядина",
              "перепелиный желток",
              "дижонская горчица",
              "копчёное масло",
              "каперсы",
              "лук-шалот",
            ],
            protein: 28,
            fat: 19,
            carbs: 4,
          },
          {
            id: "d2",
            name: "Баурсаки с трюфельным мёдом",
            desc: "Домашние баурсаки, крем-сыр, трюфельный мёд",
            price: 3200,
            weight: 140,
            kcal: 420,
            tags: ["выпечка", "веган 🌱", "хит 🔥"],
            image: img("photo-1509440159596-0249088772ff"),
            ingredients: ["мука", "крем-сыр", "трюфельный мёд", "сливочное масло", "морская соль"],
            protein: 9,
            fat: 22,
            carbs: 48,
          },
          {
            id: "d2_1",
            name: "Казы Карпаччо",
            desc: "Казы домашнего копчения, трюфельное масло, пармезан, руккола",
            price: 5500,
            weight: 160,
            kcal: 350,
            tags: ["хит 🔥"],
            image: img("photo-1608039755401-742074f0548d"),
            ingredients: ["казы", "трюфельное масло", "пармезан", "руккола"],
            protein: 24,
            fat: 18,
            carbs: 2,
          },
        ],
      },
      {
        section: "Салаты",
        items: [
          {
            id: "d2_2",
            name: "Салат с копчёной кониной",
            desc: "Свежие овощи, перепелиные яйца, горчичная заправка, ломтики конины",
            price: 4800,
            weight: 220,
            kcal: 280,
            tags: ["лёгкое"],
            image: img("photo-1512621776951-a57141f2eefd"),
            ingredients: [
              "конина",
              "салат",
              "помидоры черри",
              "перепелиные яйца",
              "горчичная заправка",
            ],
            protein: 22,
            fat: 12,
            carbs: 15,
          },
          {
            id: "d2_3",
            name: "Хрустящие баклажаны",
            desc: "Баклажаны фри, томаты, сладкий чили соус, кинза",
            price: 3900,
            weight: 250,
            kcal: 310,
            tags: ["веган 🌱", "хит 🔥"],
            image: img("photo-1546069901-d5bfd2cbfb1f"),
            ingredients: ["баклажаны", "крахмал", "томаты", "сладкий чили", "кинза"],
            protein: 4,
            fat: 15,
            carbs: 35,
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
            tags: ["ягнёнок", "традиция", "хит 🔥"],
            image: img("photo-1546069901-ba9599a7e63c"),
            ingredients: [
              "ягнёнок томлёный 12ч",
              "тесто ручной раскатки",
              "лук",
              "сорпа",
              "зелень",
            ],
            protein: 42,
            fat: 31,
            carbs: 55,
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
            ingredients: [
              "дикий судак",
              "ферментированный перец",
              "зелёное масло",
              "лимон",
              "тимьян",
            ],
            protein: 34,
            fat: 14,
            carbs: 6,
          },
          {
            id: "d4_1",
            name: "Сырне из козлятины",
            desc: "Мясо козлёнка, запечённое в собственном соку с овощами в дровяной печи",
            price: 14500,
            weight: 600,
            kcal: 850,
            tags: ["новинка ✨", "на двоих"],
            image: img("photo-1544025162-d76694265947"),
            ingredients: ["козлятина", "картофель", "морковь", "лук", "специи"],
            protein: 55,
            fat: 40,
            carbs: 45,
          },
        ],
      },
      {
        section: "Десерты",
        items: [
          {
            id: "d4_2",
            name: "Чак-чак с фисташками",
            desc: "Хрустящее тесто в медовом сиропе с иранскими фисташками",
            price: 2500,
            weight: 150,
            kcal: 450,
            tags: ["сладкое"],
            image: img("photo-1509440159596-0249088772ff"),
            ingredients: ["мука", "яйца", "мёд", "фисташки", "сахар"],
            protein: 6,
            fat: 20,
            carbs: 65,
          },
          {
            id: "d4_3",
            name: "Жент в шоколаде",
            desc: "Традиционный казахский десерт в бельгийском шоколаде",
            price: 2800,
            weight: 120,
            kcal: 380,
            tags: ["сладкое", "хит 🔥"],
            image: img("photo-1512621776951-a57141f2eefd"),
            ingredients: ["талкан", "сливочное масло", "сахар", "тёмный шоколад"],
            protein: 5,
            fat: 22,
            carbs: 40,
          },
        ],
      },
      {
        section: "Напитки",
        items: [
          {
            id: "d4_4",
            name: "Чай по-степному",
            desc: "Чёрный чай, молоко, тары, сливки, сливочное масло",
            price: 2000,
            weight: 600,
            kcal: 180,
            tags: ["напитки", "хит 🔥"],
            image: img("photo-1544148103-0773bf10d330"),
            ingredients: ["чай", "молоко", "тары", "сливки", "масло"],
            protein: 4,
            fat: 10,
            carbs: 12,
          },
          {
            id: "d4_5",
            name: "Кымыз крафтовый",
            desc: "Освежающий напиток из кобыльего молока",
            price: 2200,
            weight: 500,
            kcal: 150,
            tags: ["напитки", "веган 🌱"],
            image: img("photo-1533089860892-a7c6f0a88666"),
            ingredients: ["кобылье молоко"],
            protein: 8,
            fat: 4,
            carbs: 15,
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
    cuisine: "Европейская · стейки",
    district: "Есиль",
    address: "пр. Мангилик Ел, 55",
    hours: "12:00 – 02:00",
    avgCheck: 25000,
    rating: 4.8,
    reviews: 942,
    distanceKm: 2.4,
    occupancy: 48,
    peakHours: "20:00 – 23:00",
    cover: img("photo-1514933651103-005eec06c04b"),
    gallery: [
      img("photo-1514933651103-005eec06c04b"),
      img("photo-1552566626-52f8b828add9"),
      img("photo-1497644083578-611b798c60f3"),
    ],
    coords: { lng: 71.4212, lat: 51.1096 },
    description:
      "Арки и витражи в духе раннего Средневековья, мангалы с живым огнём в залах, собственное пиво и обширная винная карта. Живая музыка по вечерам.",
    tags: ["Стейки на огне", "Своё пиво", "Живая музыка"],
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
            tags: ["говядина", "dry-aged", "хит 🔥"],
            image: img("photo-1558030006-450675393462"),
            ingredients: [
              "рибай ангус 45 дней выдержки",
              "соль Малдон",
              "костный мозг",
              "розмарин",
              "чеснок конфи",
            ],
            protein: 62,
            fat: 58,
            carbs: 0,
          },
          {
            id: "l2",
            name: "Тендерлоин Стейк",
            desc: "Самая нежная часть говядины, перечный соус, спаржа",
            price: 18500,
            weight: 250,
            kcal: 450,
            tags: ["говядина"],
            image: img("photo-1544025162-d76694265947"),
            ingredients: ["вырезка говяжья", "чёрный перец", "сливки", "спаржа", "чеснок"],
            protein: 50,
            fat: 25,
            carbs: 5,
          },
        ],
      },
      {
        section: "Закуски",
        items: [
          {
            id: "l3",
            name: "Карпаччо из говядины",
            desc: "Слайсы мраморной говядины, пармезан, каперсы, трюфельное масло",
            price: 6500,
            weight: 180,
            kcal: 320,
            tags: ["сырое"],
            image: img("photo-1512621776951-a57141f2eefd"),
            ingredients: [
              "мраморная говядина",
              "пармезан",
              "каперсы",
              "трюфельное масло",
              "лимонный сок",
            ],
            protein: 26,
            fat: 22,
            carbs: 3,
          },
          {
            id: "l4",
            name: "Костный мозг из печи",
            desc: "Запечённая мозговая кость, тосты бриошь, луковый мармелад",
            price: 4200,
            weight: 250,
            kcal: 680,
            tags: ["деликатес", "хит 🔥"],
            image: img("photo-1509440159596-0249088772ff"),
            ingredients: ["мозговая кость", "бриошь", "лук", "бальзамик"],
            protein: 15,
            fat: 65,
            carbs: 18,
          },
        ],
      },
      {
        section: "Гарниры",
        items: [
          {
            id: "l5",
            name: "Картофель с трюфелем",
            desc: "Молодой картофель, пармезан, трюфельная паста",
            price: 3500,
            weight: 200,
            kcal: 380,
            tags: ["веган 🌱", "хит 🔥"],
            image: img("photo-1512621776951-a57141f2eefd"),
            ingredients: ["картофель", "трюфельная паста", "пармезан", "сливочное масло"],
            protein: 6,
            fat: 20,
            carbs: 45,
          },
          {
            id: "l6",
            name: "Овощи гриль",
            desc: "Цукини, баклажаны, перец, томаты черри",
            price: 2800,
            weight: 220,
            kcal: 180,
            tags: ["веган 🌱"],
            image: img("photo-1546069901-d5bfd2cbfb1f"),
            ingredients: ["цукини", "баклажан", "болгарский перец", "черри", "оливковое масло"],
            protein: 4,
            fat: 10,
            carbs: 15,
          },
        ],
      },
      {
        section: "Напитки",
        items: [
          {
            id: "l7",
            name: "Line Brew Stout 0.5",
            desc: "Крафтовый тёмный стаут собственного производства",
            price: 2500,
            weight: 500,
            kcal: 210,
            tags: ["крафт", "алкоголь"],
            image: img("photo-1558030006-450675393462"),
            ingredients: ["вода", "солод", "хмель", "дрожжи"],
            protein: 2,
            fat: 0,
            carbs: 18,
          },
          {
            id: "l8",
            name: "Line Brew Lager 0.5",
            desc: "Светлый крафтовый лагер, нефильтрованное",
            price: 2200,
            weight: 500,
            kcal: 190,
            tags: ["крафт", "алкоголь", "хит 🔥"],
            image: img("photo-1533089860892-a7c6f0a88666"),
            ingredients: ["вода", "солод", "хмель", "дрожжи"],
            protein: 2,
            fat: 0,
            carbs: 15,
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
    name: "Eva Wine Cafe",
    cuisine: "Comfort food · винотека",
    district: "Сарыарка",
    address: "ул. А. Байтурсынова, 3",
    hours: "09:00 – 00:00",
    avgCheck: 12000,
    rating: 4.7,
    reviews: 610,
    distanceKm: 0.8,
    occupancy: 64,
    peakHours: "09:00 – 12:00",
    cover: img("photo-1560624052-449f5ddf0c31"),
    gallery: [
      img("photo-1560624052-449f5ddf0c31"),
      img("photo-1544148103-0773bf10d330"),
      img("photo-1533777857889-4be7c70b33f7"),
    ],
    coords: { lng: 71.4142, lat: 51.1352 },
    description:
      "Сердце города между левым и правым берегом. Понятные и самобытные блюда comfort food, винотека и тёплое гостеприимство команды с утра до полуночи.",
    tags: ["Завтраки", "Вино", "Comfort food"],
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
            tags: ["яйца", "рыба", "хит 🔥"],
            image: img("photo-1608039755401-742074f0548d"),
            ingredients: [
              "бриошь",
              "яйцо пашот",
              "лосось слабой соли",
              "голландский соус",
              "укроп",
            ],
            protein: 26,
            fat: 32,
            carbs: 28,
          },
          {
            id: "n2",
            name: "Сырники из фермерского творога",
            desc: "Сметана, свежие ягоды, кленовый сироп",
            price: 3500,
            weight: 200,
            kcal: 480,
            tags: ["сладкое", "веган 🌱"],
            image: img("photo-1509440159596-0249088772ff"),
            ingredients: [
              "творог 9%",
              "яйцо",
              "мука",
              "сахар",
              "сметана",
              "ягоды",
              "кленовый сироп",
            ],
            protein: 22,
            fat: 20,
            carbs: 45,
          },
          {
            id: "n3",
            name: "Английский завтрак",
            desc: "Яичница, сосиски, бекон, фасоль, томаты, грибы",
            price: 5200,
            weight: 350,
            kcal: 850,
            tags: ["сытное"],
            image: img("photo-1546069901-ba9599a7e63c"),
            ingredients: ["яйца", "сосиски", "бекон", "фасоль", "черри", "шампиньоны", "тосты"],
            protein: 35,
            fat: 60,
            carbs: 45,
          },
        ],
      },
      {
        section: "Салаты",
        items: [
          {
            id: "n4",
            name: "Салат с ростбифом",
            desc: "Микс салата, ростбиф, вяленые томаты, медово-горчичный соус",
            price: 4500,
            weight: 220,
            kcal: 320,
            tags: ["лёгкое"],
            image: img("photo-1512621776951-a57141f2eefd"),
            ingredients: [
              "ростбиф",
              "микс салата",
              "вяленые томаты",
              "горчица",
              "мёд",
              "оливковое масло",
            ],
            protein: 25,
            fat: 18,
            carbs: 12,
          },
          {
            id: "n5",
            name: "Цезарь с креветками",
            desc: "Романо, тигровые креветки, пармезан, крутоны, классический соус",
            price: 5200,
            weight: 250,
            kcal: 450,
            tags: ["морепродукты"],
            image: img("photo-1546069901-d5bfd2cbfb1f"),
            ingredients: ["романо", "креветки", "пармезан", "крутоны", "соус цезарь"],
            protein: 28,
            fat: 30,
            carbs: 15,
          },
        ],
      },
      {
        section: "Горячее",
        items: [
          {
            id: "n6",
            name: "Паста с трюфельным кремом",
            desc: "Фетучини, трюфельная паста, сливки, пармезан",
            price: 4800,
            weight: 300,
            kcal: 650,
            tags: ["веган 🌱", "хит 🔥"],
            image: img("photo-1414235077428-338989a2e8c0"),
            ingredients: ["паста", "сливки", "трюфельная паста", "пармезан", "чеснок"],
            protein: 18,
            fat: 35,
            carbs: 60,
          },
          {
            id: "n7",
            name: "Лосось с брокколи",
            desc: "Стейк из лосося, бланшированная брокколи, сливочно-лимонный соус",
            price: 7500,
            weight: 280,
            kcal: 420,
            tags: ["рыба", "здоровье"],
            image: img("photo-1519708227418-c8fd9a32b7a2"),
            ingredients: ["лосось", "брокколи", "сливки", "лимон", "укроп"],
            protein: 35,
            fat: 25,
            carbs: 8,
          },
        ],
      },
      {
        section: "Напитки",
        items: [
          {
            id: "n8",
            name: "Капучино",
            desc: "Классический капучино на зёрнах 100% арабики",
            price: 1500,
            weight: 250,
            kcal: 120,
            tags: ["напитки", "кофе"],
            image: img("photo-1533089860892-a7c6f0a88666"),
            ingredients: ["эспрессо", "молоко"],
            protein: 5,
            fat: 6,
            carbs: 8,
          },
          {
            id: "n9",
            name: "Лимонад Маракуйя-Апельсин",
            desc: "Освежающий лимонад со свежей маракуйей и апельсином",
            price: 2200,
            weight: 400,
            kcal: 180,
            tags: ["напитки", "хит 🔥"],
            image: img("photo-1544148103-0773bf10d330"),
            ingredients: ["пюре маракуйи", "фреш апельсина", "сироп", "содовая", "лёд"],
            protein: 1,
            fat: 0,
            carbs: 45,
          },
        ],
      },
    ],
    specials: [],
  },
  {
    id: "sadu",
    name: "Selfie",
    cuisine: "Современная авторская",
    district: "Ritz-Carlton, 18 этаж",
    address: "ул. Достык, 16",
    hours: "12:00 – 00:00",
    avgCheck: 15000,
    rating: 4.9,
    reviews: 1520,
    distanceKm: 3.1,
    occupancy: 92,
    peakHours: "19:00 – 21:00",
    cover: img("photo-1550966871-3ed3cdb5ed0c"),
    gallery: [
      img("photo-1550966871-3ed3cdb5ed0c"),
      img("photo-1581349485608-9469926a8e5e"),
      img("photo-1600565193348-f74bd3c7ccdf"),
    ],
    coords: { lng: 71.4262, lat: 51.1291 },
    description:
      "Панорамный ресторан на 18 этаже Ritz-Carlton. Интернациональные рецепты, сезонные продукты и открытая кухня, где блюда рождаются на глазах у гостей. №1 в рейтинге ABBA Awards 2025.",
    tags: ["Панорама", "Открытая кухня", "ABBA Awards"],
    menu: [
      {
        section: "Дим-самы",
        items: [
          {
            id: "sd1",
            name: "Дим-самы с креветкой",
            desc: "Тигровая креветка, бамбук, соус понзу",
            price: 4200,
            weight: 160,
            kcal: 290,
            tags: ["морепродукты", "пар", "хит 🔥"],
            image: img("photo-1496116218417-1a781b1c416c"),
            ingredients: ["тигровая креветка", "рисовое тесто", "бамбук", "понзу", "имбирь"],
            protein: 18,
            fat: 8,
            carbs: 34,
          },
          {
            id: "sd1_1",
            name: "Дим-самы со свининой и трюфелем",
            desc: "Фарш из свинины, трюфельная паста, чёрное тесто",
            price: 4500,
            weight: 160,
            kcal: 350,
            tags: ["пар", "деликатес"],
            image: img("photo-1525755662778-989d0524087e"),
            ingredients: ["свинина", "чернила каракатицы", "рисовое тесто", "трюфельная паста"],
            protein: 20,
            fat: 18,
            carbs: 30,
          },
        ],
      },
      {
        section: "Закуски",
        items: [
          {
            id: "sd2",
            name: "Утка по-пекински роллы",
            desc: "Утка конфи, блинчики, соус хойсин, огурец",
            price: 6800,
            weight: 240,
            kcal: 520,
            tags: ["утка", "хит 🔥"],
            image: img("photo-1525755662778-989d0524087e"),
            ingredients: ["утка конфи", "рисовые блинчики", "хойсин", "огурец", "зелёный лук"],
            protein: 31,
            fat: 28,
            carbs: 38,
          },
          {
            id: "sd3",
            name: "Эдамаме с морской солью",
            desc: "Бобовые эдамаме на пару, крупная морская соль",
            price: 2500,
            weight: 150,
            kcal: 180,
            tags: ["веган 🌱"],
            image: img("photo-1512621776951-a57141f2eefd"),
            ingredients: ["бобы эдамаме", "морская соль"],
            protein: 16,
            fat: 8,
            carbs: 14,
          },
        ],
      },
      {
        section: "Горячее",
        items: [
          {
            id: "sd4",
            name: "Пад Тай с курицей",
            desc: "Рисовая лапша, куриное филе, яйцо, тофу, арахис, тамариндовый соус",
            price: 4800,
            weight: 350,
            kcal: 650,
            tags: ["курица", "хит 🔥"],
            image: img("photo-1546069901-d5bfd2cbfb1f"),
            ingredients: [
              "рисовая лапша",
              "курица",
              "яйцо",
              "тофу",
              "ростки сои",
              "арахис",
              "тамаринд",
            ],
            protein: 32,
            fat: 20,
            carbs: 75,
          },
          {
            id: "sd5",
            name: "Говядина в чёрном перце",
            desc: "Нежная говядина, сладкий перец, лук, пикантный перечный соус",
            price: 6500,
            weight: 300,
            kcal: 520,
            tags: ["говядина", "острое 🌶"],
            image: img("photo-1544025162-d76694265947"),
            ingredients: ["говядина", "болгарский перец", "лук", "соевый соус", "чёрный перец"],
            protein: 40,
            fat: 25,
            carbs: 20,
          },
        ],
      },
      {
        section: "Супы",
        items: [
          {
            id: "sd6",
            name: "Том Ям с морепродуктами",
            desc: "Острый тайский суп, креветки, кальмары, мидии, грибы шиитаке, кокосовое молоко",
            price: 5500,
            weight: 400,
            kcal: 450,
            tags: ["морепродукты", "острое 🌶", "хит 🔥"],
            image: img("photo-1544148103-0773bf10d330"),
            ingredients: [
              "креветки",
              "кальмары",
              "мидии",
              "кокосовое молоко",
              "лемнграсс",
              "галангал",
              "чили",
              "грибы",
            ],
            protein: 28,
            fat: 30,
            carbs: 18,
          },
        ],
      },
      {
        section: "Напитки",
        items: [
          {
            id: "sd7",
            name: "Матча Латте",
            desc: "Японский зелёный чай матча, взбитое кокосовое молоко",
            price: 2200,
            weight: 300,
            kcal: 180,
            tags: ["напитки", "веган 🌱"],
            image: img("photo-1533089860892-a7c6f0a88666"),
            ingredients: ["чай матча", "кокосовое молоко", "сироп агавы"],
            protein: 3,
            fat: 10,
            carbs: 15,
          },
        ],
      },
    ],
    specials: [],
  },
  // --- НОВЫЕ РЕСТОРАНЫ (ФАЗА 3) ---
  {
    id: "marrakesh",
    name: "Tangiers Lounge",
    cuisine: "Лаунж · авторская миксология",
    district: "Самал",
    address: "ул. Самал, 11",
    hours: "14:00 – 04:00",
    avgCheck: 14000,
    rating: 4.7,
    reviews: 412,
    distanceKm: 4.2,
    occupancy: 38,
    peakHours: "22:00 – 01:00",
    cover: img("photo-1572116469696-31de0f17cc34"),
    gallery: [
      img("photo-1572116469696-31de0f17cc34"),
      img("photo-1543007630-9710e4a00a20"),
      img("photo-1470337458703-46ad1756a187"),
    ],
    coords: { lng: 71.4568, lat: 51.1602 },
    description:
      "Особняк, где английская классика встречается с гранжем. Авторские находки миксологов, восточная кухня и атмосфера модного заведения для особенных гостей.",
    tags: ["Миксология", "Кальян", "Поздний вечер"],
    menu: [
      {
        section: "Основные",
        items: [
          {
            id: "mr1",
            name: "Тажин с бараниной и черносливом",
            desc: "Томлёная баранина, миндаль, кунжут, специи рас-эль-ханут",
            price: 7500,
            weight: 400,
            kcal: 820,
            tags: ["баранина", "хит 🔥"],
            image: img("photo-1544025162-d76694265947"),
            ingredients: ["баранина", "чернослив", "миндаль", "кунжут", "специи"],
            protein: 38,
            fat: 45,
            carbs: 40,
          },
          {
            id: "mr2",
            name: "Кускус с 7 овощами",
            desc: "Традиционный кускус, сезонные овощи, карамелизированный лук с изюмом",
            price: 4500,
            weight: 350,
            kcal: 480,
            tags: ["веган 🌱"],
            image: img("photo-1512621776951-a57141f2eefd"),
            ingredients: ["кускус", "морковь", "кабачок", "тыква", "лук", "изюм", "нут"],
            protein: 12,
            fat: 8,
            carbs: 85,
          },
        ],
      },
      {
        section: "Закуски",
        items: [
          {
            id: "mr3",
            name: "Ассорти мезе",
            desc: "Хумус, бабагануш, заалук, подается с тёплой питой",
            price: 5200,
            weight: 300,
            kcal: 650,
            tags: ["веган 🌱", "на компанию"],
            image: img("photo-1546069901-d5bfd2cbfb1f"),
            ingredients: [
              "нут",
              "баклажаны",
              "тахини",
              "томаты",
              "чеснок",
              "оливковое масло",
              "пита",
            ],
            protein: 18,
            fat: 42,
            carbs: 55,
          },
        ],
      },
      {
        section: "Напитки",
        items: [
          {
            id: "mr4",
            name: "Марокканский мятный чай",
            desc: "Зелёный чай, свежая мята, сахар (на чайник)",
            price: 2500,
            weight: 800,
            kcal: 120,
            tags: ["напитки", "хит 🔥"],
            image: img("photo-1544148103-0773bf10d330"),
            ingredients: ["зелёный чай", "свежая мята", "сахар"],
            protein: 0,
            fat: 0,
            carbs: 30,
          },
        ],
      },
    ],
    specials: [],
  },
  {
    id: "kinza",
    name: "Lou Lou",
    cuisine: "Европейская",
    district: "Есиль",
    address: "ул. Достык, 13",
    hours: "12:00 – 00:00",
    avgCheck: 22000,
    rating: 4.8,
    reviews: 875,
    distanceKm: 2.8,
    occupancy: 84,
    peakHours: "19:30 – 22:30",
    cover: img("photo-1537047902294-62a40c20a6ae"),
    gallery: [
      img("photo-1537047902294-62a40c20a6ae"),
      img("photo-1502301103665-0b95cc738daf"),
      img("photo-1579027989536-b7b1f875659b"),
    ],
    coords: { lng: 71.4298, lat: 51.1268 },
    description:
      "Европейская эстетика до мелочей: бархат, живые цветы и хлеб собственной пекарни. Необычные коктейли и винная карта. После 21:00 — вход 21+.",
    tags: ["Европейская", "Коктейли", "21+ вечером"],
    menu: [
      {
        section: "Закуски",
        items: [
          {
            id: "kz2",
            name: "Хлеб Lou Lou",
            desc: "Хлеб собственной пекарни, взбитое масло с морской солью",
            price: 2400,
            weight: 220,
            kcal: 540,
            tags: ["хит 🔥"],
            image: img("photo-1509440159596-0249088772ff"),
            ingredients: ["закваска", "мука", "сливочное масло", "морская соль"],
            protein: 14,
            fat: 22,
            carbs: 70,
          },
          {
            id: "kz3",
            name: "Салат Нисуаз",
            desc: "Тунец, перепелиное яйцо, стручковая фасоль, оливки таджаска",
            price: 5600,
            weight: 260,
            kcal: 420,
            tags: ["лёгкое"],
            image: img("photo-1546069901-ba9599a7e63c"),
            ingredients: ["тунец", "яйцо", "фасоль", "оливки", "томаты"],
            protein: 28,
            fat: 24,
            carbs: 18,
          },
        ],
      },
      {
        section: "Основные",
        items: [
          {
            id: "kz1",
            name: "Стейк из тунца",
            desc: "Тунец в кунжутной корочке, пюре из цветной капусты, соус понзу",
            price: 9800,
            weight: 280,
            kcal: 520,
            tags: ["рыба", "хит 🔥"],
            image: img("photo-1519708227418-c8fd9a32b7a2"),
            ingredients: ["тунец", "кунжут", "цветная капуста", "понзу"],
            protein: 44,
            fat: 20,
            carbs: 16,
          },
          {
            id: "kz4",
            name: "Филе-миньон",
            desc: "Говяжья вырезка, соус из зелёного перца, картофель гратен",
            price: 12500,
            weight: 320,
            kcal: 780,
            tags: ["мясо"],
            image: img("photo-1544025162-d76694265947"),
            ingredients: ["говядина", "зелёный перец", "сливки", "картофель"],
            protein: 52,
            fat: 46,
            carbs: 28,
          },
        ],
      },
      {
        section: "Вино",
        items: [
          {
            id: "kz5",
            name: "Chablis, бокал",
            desc: "Бургундия, сухое белое, минеральное послевкусие",
            price: 5200,
            weight: 150,
            kcal: 120,
            tags: ["вино"],
            image: img("photo-1510812431401-41d2bd2722f3"),
            protein: 0,
            fat: 0,
            carbs: 4,
          },
        ],
      },
    ],
    specials: [
      {
        id: "s_kinza",
        name: "Сет шефа на двоих",
        desc: "Хлеб Lou Lou, Нисуаз, тунец и филе-миньон, десерт дня",
        price: 32000,
        weight: 0,
        kcal: 0,
        tags: ["на двоих"],
        image: img("photo-1502301103665-0b95cc738daf"),
        special: "Сет",
      },
    ],
  },
  {
    id: "xoxo",
    name: "XOXO SPORTS & LOUNGE",
    cuisine: "Sports Bar · Lounge",
    district: "Астана",
    address: "ул. Асфендиярова, 8",
    hours: "17:00 – 04:00",
    avgCheck: 5000,
    rating: 4.7,
    reviews: 320,
    distanceKm: 2.1,
    occupancy: 58,
    peakHours: "22:00 – 01:00",
    cover: "/image/xobar1.png",
    gallery: ["/image/xobar1.png", "/image/xobar2.png", "/image/xobar3.png"],
    coords: { lng: 71.4308, lat: 51.1284 },
    description:
      "Спорт-бар и лаунж с широким выбором напитков, коктейлей и закусок. Трансляции матчей, живая атмосфера.",
    tags: ["Sports Bar", "Лаунж", "Коктейли"],
    menu: [
      {
        section: "Джин",
        items: [
          { id: "xo1", name: "Beefeater", desc: "Классический лондонский сухой джин", price: 2000, weight: 0, kcal: 0, tags: ["джин"], image: "/image/xoxo-exchange/beefeater.jpg" },
        ],
      },
      {
        section: "Ром & Ликеры",
        items: [
          { id: "xo2", name: "Bacardi black", desc: "Тёмный ром с карамельными нотами", price: 1600, weight: 0, kcal: 0, tags: ["ром"], image: "/image/xoxo-exchange/bacardi.jpeg" },
          { id: "xo3", name: "Oakheart", desc: "Пряный ром с нотами дуба и ванили", price: 2000, weight: 0, kcal: 0, tags: ["ром"], image: "/image/xoxo-exchange/okheart.jpg" },
          { id: "xo4", name: "Captain Morgan", desc: "Золотистый пряный ром", price: 1600, weight: 0, kcal: 0, tags: ["ром"], image: img("photo-1572490122747-3968b75cc699") },
          { id: "xo5", name: "Jaggermeister", desc: "Травяной ликёр, 56 ингредиентов", price: 2000, weight: 0, kcal: 0, tags: ["ликёр"], image: "/image/xoxo-exchange/jagermeister.jpg" },
        ],
      },
      {
        section: "Виски",
        items: [
          { id: "xo6", name: "Monkey Shoulder", desc: "Купажированный шотландский виски", price: 3500, weight: 0, kcal: 0, tags: ["виски", "хит 🔥"], image: "/image/xoxo-exchange/monkeyshoulder.jpg" },
          { id: "xo7", name: "Jack Daniels", desc: "Теннессийский виски, фильтрация через уголь", price: 3000, weight: 0, kcal: 0, tags: ["виски"], image: img("photo-1527281400683-1aae777175f8") },
          { id: "xo8", name: "Chivas", desc: "Купажированный шотландский виски 12 лет", price: 3000, weight: 0, kcal: 0, tags: ["виски"], image: "/image/xoxo-exchange/chivas.jpg" },
          { id: "xo9", name: "Jameson", desc: "Ирландский тройной дистилляции", price: 2000, weight: 0, kcal: 0, tags: ["виски"], image: "/image/xoxo-exchange/jameson.jpg" },
          { id: "xo10", name: "Ballantines", desc: "Лёгкий купажированный скотч", price: 2000, weight: 0, kcal: 0, tags: ["виски"], image: "/image/xoxo-exchange/ballatines.webp" },
        ],
      },
      {
        section: "Водка",
        items: [
          { id: "xo11", name: "Absolut", desc: "Шведская пшеничная водка", price: 1450, weight: 0, kcal: 0, tags: ["водка"], image: "/image/xoxo-exchange/absolut.jpeg" },
          { id: "xo12", name: "Nemiroff", desc: "Украинская премиальная водка", price: 1300, weight: 0, kcal: 0, tags: ["водка"], image: "/image/xoxo-exchange/nemoriff.jpg" },
          { id: "xo13", name: "Хортица ICE", desc: "Мягкая ледяная водка", price: 890, weight: 0, kcal: 0, tags: ["водка"], image: img("photo-1607622750671-6cd9a99eabd1") },
          { id: "xo14", name: "Кызылжар черный", desc: "Казахстанская водка", price: 790, weight: 0, kcal: 0, tags: ["водка"], image: img("photo-1607622750671-6cd9a99eabd1") },
        ],
      },
      {
        section: "Пиво бутылочное",
        items: [
          { id: "xo15", name: "Holsten", desc: "Классический немецкий лагер", price: 1400, weight: 0, kcal: 0, tags: ["пиво"], image: img("photo-1535958636474-b021ee887b13") },
          { id: "xo16", name: "Blanc", desc: "Пшеничное нефильтрованное", price: 1700, weight: 0, kcal: 0, tags: ["пиво"], image: img("photo-1535958636474-b021ee887b13") },
          { id: "xo17", name: "Carlsberg", desc: "Датский лагер", price: 1500, weight: 0, kcal: 0, tags: ["пиво"], image: img("photo-1535958636474-b021ee887b13") },
          { id: "xo18", name: "Efes", desc: "Турецкий светлый лагер", price: 1500, weight: 0, kcal: 0, tags: ["пиво"], image: img("photo-1535958636474-b021ee887b13") },
          { id: "xo19", name: "Miller", desc: "Американский лёгкий лагер", price: 1650, weight: 0, kcal: 0, tags: ["пиво"], image: "/image/xoxo-exchange/miller.jpeg" },
          { id: "xo20", name: "BUD", desc: "Американский лагер", price: 2190, weight: 0, kcal: 0, tags: ["пиво"], image: "/image/xoxo-exchange/buds.jpg" },
          { id: "xo21", name: "Heineken", desc: "Голландский премиум лагер", price: 2990, weight: 0, kcal: 0, tags: ["пиво", "хит 🔥"], image: img("photo-1535958636474-b021ee887b13") },
          { id: "xo22", name: "Corona Extra", desc: "Мексиканский лагер с лаймом", price: 2500, weight: 0, kcal: 0, tags: ["пиво"], image: "/image/xoxo-exchange/corona extra.jpeg" },
          { id: "xo23", name: "Stella Artois", desc: "Бельгийский пилснер", price: 2500, weight: 0, kcal: 0, tags: ["пиво"], image: img("photo-1535958636474-b021ee887b13") },
          { id: "xo24", name: "Hacker Pschorr Munchner Gold", desc: "Баварское золотое пиво", price: 2500, weight: 0, kcal: 0, tags: ["пиво"], image: img("photo-1535958636474-b021ee887b13") },
          { id: "xo25", name: "Paulaner Wiessbier", desc: "Баварское пшеничное", price: 2500, weight: 0, kcal: 0, tags: ["пиво"], image: img("photo-1535958636474-b021ee887b13") },
          { id: "xo26", name: "Paulaner Munchner Hell", desc: "Мюнхенский светлый лагер", price: 2500, weight: 0, kcal: 0, tags: ["пиво"], image: img("photo-1535958636474-b021ee887b13") },
          { id: "xo27", name: "Staropramen", desc: "Чешский лагер из Праги", price: 2500, weight: 0, kcal: 0, tags: ["пиво"], image: img("photo-1535958636474-b021ee887b13") },
          { id: "xo28", name: "Безалкогольное Tsingtao", desc: "Китайское безалкогольное пиво", price: 2500, weight: 0, kcal: 0, tags: ["пиво", "безалкогольное"], image: "/image/xoxo-exchange/tsintao.jpg" },
          { id: "xo29", name: "Hoegaarden", desc: "Бельгийское белое пшеничное", price: 2500, weight: 0, kcal: 0, tags: ["пиво"], image: "/image/xoxo-exchange/hoegaarden.jpg" },
        ],
      },
      {
        section: "Пивные напитки",
        items: [
          { id: "xo30", name: "Garage", desc: "Пивной напиток со вкусом лимона", price: 1500, weight: 0, kcal: 0, tags: ["пивной напиток"], image: img("photo-1558642452-9d2a7deb7f62") },
          { id: "xo31", name: "Lab Rioni", desc: "Грузинский пивной напиток", price: 1500, weight: 0, kcal: 0, tags: ["пивной напиток"], image: img("photo-1558642452-9d2a7deb7f62") },
          { id: "xo32", name: "Somersby", desc: "Яблочный сидр", price: 1500, weight: 0, kcal: 0, tags: ["сидр"], image: img("photo-1558642452-9d2a7deb7f62") },
          { id: "xo33", name: "Chester", desc: "Английский пивной напиток", price: 2500, weight: 0, kcal: 0, tags: ["пивной напиток"], image: img("photo-1558642452-9d2a7deb7f62") },
        ],
      },
      {
        section: "Закуски",
        items: [
          { id: "xo34", name: "Соленый арахис", desc: "Классическая барная закуска", price: 1500, weight: 0, kcal: 0, tags: ["закуска"], image: img("photo-1621939514649-280e2ee25f60") },
          { id: "xo35", name: "Миндаль", desc: "Жареный солёный миндаль", price: 1500, weight: 0, kcal: 0, tags: ["закуска"], image: img("photo-1621939514649-280e2ee25f60") },
          { id: "xo36", name: "Фисташки", desc: "Солёные фисташки в скорлупе", price: 1800, weight: 0, kcal: 0, tags: ["закуска", "хит 🔥"], image: img("photo-1621939514649-280e2ee25f60") },
          { id: "xo37", name: "Чечил", desc: "Копчёный сыр косичкой", price: 1500, weight: 0, kcal: 0, tags: ["закуска"], image: img("photo-1621939514649-280e2ee25f60") },
          { id: "xo38", name: "Сухарики", desc: "Ржаные сухарики с чесноком", price: 1500, weight: 0, kcal: 0, tags: ["закуска"], image: img("photo-1621939514649-280e2ee25f60") },
          { id: "xo39", name: "Чипсы Lays", desc: "Картофельные чипсы", price: 1500, weight: 0, kcal: 0, tags: ["закуска"], image: img("photo-1621939514649-280e2ee25f60") },
        ],
      },
      {
        section: "Безалкогольные напитки",
        items: [
          ...["Coca-Cola", "Fanta", "Sprite"].flatMap((name, brand) => [
            { volume: "250 мл · стекло", price: 1100 }, { volume: "500 мл", price: 1000 },
            { volume: "1 л", price: 1500 }, { volume: "1,5 л", price: 1800 }, { volume: "2 л", price: 2300 },
          ].map((variant, size) => ({ id: `xo-soda-${brand}-${size}`, name: `${name} · ${variant.volume}`, desc: "Газированный напиток", price: variant.price, weight: 0, kcal: 0, tags: ["газировка"], image: img("photo-1622483767028-3f66f32aef97") }))),
          { id: "xo43", name: "Fuse Tea", desc: "Холодный чай, 500 мл", price: 1500, weight: 0, kcal: 0, tags: ["чай"], image: img("photo-1622483767028-3f66f32aef97") },
        ],
      },
      {
        section: "Коктейли",
        items: [
          { id: "xo44", name: "RED BULL VODKA", desc: "Водка с энергетиком Red Bull", price: 3200, weight: 0, kcal: 0, tags: ["коктейль"], image: "/image/xoxo-exchange/rebullvodka.jpg" },
          { id: "xo45", name: "RED BULL JAGER", desc: "Jägermeister с Red Bull", price: 3200, weight: 0, kcal: 0, tags: ["коктейль"], image: img("photo-1514362545857-3bc16c4c7d1b") },
          { id: "xo46", name: "GIN TONIC", desc: "Классический джин-тоник", price: 3200, weight: 0, kcal: 0, tags: ["коктейль"], image: img("photo-1514362545857-3bc16c4c7d1b") },
          { id: "xo47", name: "RED BULL WHISKY", desc: "Виски с Red Bull", price: 3200, weight: 0, kcal: 0, tags: ["коктейль"], image: img("photo-1514362545857-3bc16c4c7d1b") },
          { id: "xo48", name: "Mojito", desc: "Классический мохито с мятой и лаймом", price: 2800, weight: 0, kcal: 0, tags: ["коктейль", "хит 🔥"], image: img("photo-1514362545857-3bc16c4c7d1b") },
          { id: "xo49", name: "Long Island", desc: "Лонг Айленд Айс Ти", price: 3500, weight: 0, kcal: 0, tags: ["коктейль"], image: img("photo-1514362545857-3bc16c4c7d1b") },
          { id: "xo50", name: "Whisky Sour", desc: "Виски, лимонный сок, сахарный сироп", price: 3200, weight: 0, kcal: 0, tags: ["коктейль"], image: img("photo-1514362545857-3bc16c4c7d1b") },
        ],
      },
      {
        section: "Разливные напитки",
        items: [
          { id: "xo51", name: "Квас", desc: "Домашний квас", price: 890, weight: 0, kcal: 0, tags: ["разливное"], image: img("photo-1535958636474-b021ee887b13") },
          { id: "xo52", name: "Лимонад", desc: "Свежий домашний лимонад", price: 890, weight: 0, kcal: 0, tags: ["разливное"], image: img("photo-1535958636474-b021ee887b13") },
          { id: "xo53", name: "Немецкое · 500 мл", desc: "Разливное пиво", price: 1190, weight: 0, kcal: 0, tags: ["пиво", "разливное"], image: "/image/xoxo-exchange/german.jpg" },
          { id: "xo53-3l", name: "Немецкое · 3 л", desc: "Разливное пиво", price: 6000, weight: 0, kcal: 0, tags: ["пиво", "разливное"], image: img("photo-1535958636474-b021ee887b13") },
          { id: "xo54", name: "Carlsberg · 500 мл", desc: "Разливное пиво", price: 1500, weight: 0, kcal: 0, tags: ["пиво", "разливное"], image: img("photo-1535958636474-b021ee887b13") },
          { id: "xo54-3l", name: "Carlsberg · 3 л", desc: "Разливное пиво", price: 8500, weight: 0, kcal: 0, tags: ["пиво", "разливное"], image: img("photo-1535958636474-b021ee887b13") },
        ],
      },
      {
        section: "Энергетики и Соки",
        items: [
          { id: "xo55", name: "Maxi Чай", desc: "Холодный чай Maxi", price: 1500, weight: 0, kcal: 0, tags: ["чай"], image: img("photo-1622483767028-3f66f32aef97") },
          { id: "xo56", name: "Натуральный сок", desc: "Свежевыжатый натуральный сок", price: 2500, weight: 0, kcal: 0, tags: ["сок"], image: img("photo-1622483767028-3f66f32aef97") },
          { id: "xo57", name: "Gorilla", desc: "Энергетический напиток", price: 1500, weight: 0, kcal: 0, tags: ["энергетик"], image: img("photo-1622483767028-3f66f32aef97") },
          { id: "xo58", name: "Dizzy", desc: "Энергетический напиток", price: 1500, weight: 0, kcal: 0, tags: ["энергетик"], image: img("photo-1622483767028-3f66f32aef97") },
          { id: "xo59", name: "Red bull", desc: "Энергетический напиток 250 мл", price: 2000, weight: 0, kcal: 0, tags: ["энергетик"], image: img("photo-1622483767028-3f66f32aef97") },
        ],
      },
      {
        section: "Минеральная вода",
        items: [
          { id: "xo60", name: "Borjomi", desc: "Грузинская минеральная вода", price: 2000, weight: 0, kcal: 0, tags: ["вода"], image: img("photo-1548839140-29a749e1cf4d") },
          ...[{ name: "Tassay · 250 мл стекло", price: 900 }, { name: "Tassay · 500 мл стекло", price: 1000 }, { name: "Tassay · 500 мл", price: 900 }, { name: "Tassay · 1 л", price: 1500 }, { name: "Tassay газ · 500 мл", price: 900 }].map((variant, index) => ({ id: `xo-water-${index}`, name: variant.name, desc: "Минеральная вода", price: variant.price, weight: 0, kcal: 0, tags: ["вода"], image: img("photo-1548839140-29a749e1cf4d") })),
          { id: "xo62", name: "Сарыагаш", desc: "Казахстанская минеральная вода", price: 1000, weight: 0, kcal: 0, tags: ["вода"], image: img("photo-1548839140-29a749e1cf4d") },
        ],
      },
      {
        section: "Лимонады",
        items: [
          { id: "xo63", name: "Ягодный", desc: "Домашний ягодный лимонад", price: 2490, weight: 0, kcal: 0, tags: ["лимонад"], image: img("photo-1513558161293-cdaf765ed514") },
          { id: "xo64", name: "Арбузный", desc: "Домашний арбузный лимонад", price: 2490, weight: 0, kcal: 0, tags: ["лимонад"], image: img("photo-1513558161293-cdaf765ed514") },
          { id: "xo65", name: "Манго маракуйя", desc: "Тропический лимонад манго-маракуйя", price: 2490, weight: 0, kcal: 0, tags: ["лимонад"], image: img("photo-1513558161293-cdaf765ed514") },
          { id: "xo66", name: "Киви лайм", desc: "Освежающий лимонад киви-лайм", price: 2490, weight: 0, kcal: 0, tags: ["лимонад"], image: img("photo-1513558161293-cdaf765ed514") },
          { id: "xo67", name: "Мохито", desc: "Безалкогольный мохито-лимонад", price: 2490, weight: 0, kcal: 0, tags: ["лимонад"], image: img("photo-1513558161293-cdaf765ed514") },
        ],
      },
      {
        section: "Горячие напитки",
        items: [
          { id: "xo68", name: "Тамерланский чай", desc: "Горячий чай", price: 2590, weight: 0, kcal: 0, tags: ["чай", "горячее"], image: img("photo-1544787219-7f47ccb76574") },
          { id: "xo69", name: "Облепиховый чай", desc: "Горячий чай с облепихой и мёдом", price: 2590, weight: 0, kcal: 0, tags: ["чай", "горячее"], image: img("photo-1544787219-7f47ccb76574") },
          { id: "xo70", name: "Малиновый чай", desc: "Ягодный чай с малиной", price: 2590, weight: 0, kcal: 0, tags: ["чай", "горячее"], image: img("photo-1544787219-7f47ccb76574") },
          { id: "xo71", name: "Смородиновый чай", desc: "Чай с чёрной смородиной", price: 2590, weight: 0, kcal: 0, tags: ["чай", "горячее"], image: img("photo-1544787219-7f47ccb76574") },
        ],
      },
    ],
    specials: [
      {
        id: "xo_sp1",
        name: "Game Night Combo",
        desc: "2 пива + закуска на выбор",
        price: 3500,
        weight: 0,
        kcal: 0,
        tags: ["комбо"],
        image: "/image/xobar2.png",
        special: "−25%",
      },
    ],
  },
];

/* ── Live ambience (short muted clips, SD ≤ 2.5 MB, poster = cover) ── */

const pexels = (path: string) => `https://videos.pexels.com/video-files/${path}.mp4`;

const liveFeeds: Record<string, Omit<LiveMedia, "poster">> = {
  sadu: { src: pexels("8051348/8051348-sd_540_960_24fps"), isLive: true, updatedMin: 0, source: "Открытая кухня" },
  kinza: { src: pexels("5102309/5102309-sd_960_540_25fps"), isLive: false, updatedMin: 6, source: "Главный зал" },
  marrakesh: { src: pexels("16696554/16696554-sd_960_402_24fps"), isLive: true, updatedMin: 0, source: "Бар" },
  auyl: { src: pexels("16478422/16478422-sd_960_540_24fps"), isLive: false, updatedMin: 12, source: "Зал" },
  nedelka: { src: pexels("19377318/19377318-sd_540_960_30fps"), isLive: false, updatedMin: 4, source: "Винная комната" },
  line: { src: pexels("10374972/10374972-sd_960_540_30fps"), isLive: true, updatedMin: 0, source: "Барная стойка" },
  xoxo: { src: pexels("12188721/12188721-sd_960_540_25fps"), isLive: true, updatedMin: 0, source: "Спорт-бар" },
};

restaurants.forEach((r) => {
  const feed = liveFeeds[r.id];
  if (feed) r.live = { ...feed, poster: r.cover };
});

/* ── Lifestyle-хаб: категории, заведения, афиша, сторис ───────────── */

export type Category = {
  key: string;
  label: string;
};

export const categories: Category[] = [
  { key: "food", label: "Рестораны" },
  { key: "concerts", label: "Концерты" },
  { key: "beauty", label: "Красота" },
  { key: "medicine", label: "Медицина" },
  { key: "auto", label: "Авто" },
];

export type Venue = {
  id: string;
  category: string;
  name: string;
  kind: string;
  rating: number;
  reviews: number;
  occupancy: number;
  peakHours: string;
  cover: string;
  priceFrom: number;
  distanceKm: number;
  badge?: string;
  services: { name: string; price: number; duration: string }[];
  coords: { lng: number; lat: number };
};

export const venues: Venue[] = [
  {
    id: "v1",
    category: "beauty",
    name: "Barbershop TOMB",
    kind: "Барбершоп · Есиль",
    rating: 4.9,
    reviews: 480,
    occupancy: 40,
    peakHours: "18:00 – 20:00",
    cover: img("photo-1585747860715-2ba37e788b70"),
    priceFrom: 7000,
    distanceKm: 1.4,
    badge: "Топ мастера",
    services: [
      { name: "Стрижка + укладка", price: 9000, duration: "60 мин" },
      { name: "Королевское бритьё", price: 7000, duration: "45 мин" },
      { name: "Комплекс отец + сын", price: 14000, duration: "90 мин" },
    ],
    coords: { lng: 71.418, lat: 51.13 },
  },
  {
    id: "v2",
    category: "medicine",
    name: "Dr. Aidyn Clinic",
    kind: "Стоматология · Байтерек",
    rating: 4.8,
    reviews: 320,
    occupancy: 80,
    peakHours: "10:00 – 14:00",
    cover: img("photo-1629909613654-28e377c37b09"),
    priceFrom: 10000,
    distanceKm: 2.1,
    badge: "Приём сегодня",
    services: [
      { name: "Профгигиена + AirFlow", price: 25000, duration: "60 мин" },
      { name: "Консультация + снимок", price: 10000, duration: "30 мин" },
      { name: "Отбеливание ZOOM 4", price: 120000, duration: "90 мин" },
    ],
    coords: { lng: 71.435, lat: 51.14 },
  },
  {
    id: "v3",
    category: "auto",
    name: "Details Detailing",
    kind: "Детейлинг · Кабанбай батыра",
    rating: 4.7,
    reviews: 210,
    occupancy: 95,
    peakHours: "12:00 – 16:00",
    cover: img("photo-1607860108855-64acf2078ed9"),
    priceFrom: 5000,
    distanceKm: 0.9,
    services: [
      { name: "Комплекс мойка", price: 5000, duration: "40 мин" },
      { name: "Химчистка салона", price: 35000, duration: "4 часа" },
      { name: "Керамика кузова", price: 180000, duration: "2 дня" },
    ],
    coords: { lng: 71.4218, lat: 51.1215 },
  },
  {
    id: "v4",
    category: "beauty",
    name: "MILA Beauty Lab",
    kind: "Салон красоты · Хайвил",
    rating: 4.9,
    reviews: 615,
    occupancy: 65,
    peakHours: "16:00 – 20:00",
    cover: img("photo-1560066984-138dadb4c035"),
    priceFrom: 8000,
    distanceKm: 1.9,
    badge: "−20% новым",
    services: [
      { name: "Маникюр + гель", price: 12000, duration: "90 мин" },
      { name: "Укладка premium", price: 8000, duration: "45 мин" },
      { name: "Комплекс подружки", price: 28000, duration: "2 часа" },
    ],
    coords: { lng: 71.412, lat: 51.145 },
  },
  // --- НОВЫЕ ЗАВЕДЕНИЯ (ФАЗА 3) ---
  {
    id: "v5",
    category: "medicine",
    name: "NurLife Clinic",
    kind: "Медицинский центр · Алматы",
    rating: 4.6,
    reviews: 245,
    occupancy: 30,
    peakHours: "08:00 – 12:00",
    cover: img("photo-1519494026892-80bbd2d6fd0d"),
    priceFrom: 6000,
    distanceKm: 5.1,
    services: [
      { name: "Приём терапевта", price: 6000, duration: "30 мин" },
      { name: "УЗИ брюшной полости", price: 8500, duration: "40 мин" },
      { name: "Комплексный Check-up", price: 45000, duration: "3 часа" },
    ],
    coords: { lng: 71.47, lat: 51.145 },
  },
  {
    id: "v6",
    category: "auto",
    name: "TurboSTO",
    kind: "СТО · Байконур",
    rating: 4.8,
    reviews: 180,
    occupancy: 85,
    peakHours: "09:00 – 11:00",
    cover: img("photo-1619642751034-765dfdf7c58e"),
    priceFrom: 4000,
    distanceKm: 6.5,
    badge: "Экспресс замена",
    services: [
      { name: "Замена масла", price: 4000, duration: "30 мин" },
      { name: "Диагностика ходовой", price: 5000, duration: "45 мин" },
      { name: "Компьютерная диагностика", price: 6000, duration: "40 мин" },
    ],
    coords: { lng: 71.45, lat: 51.18 },
  },
  {
    id: "v7",
    category: "beauty",
    name: "Orchid Nails",
    kind: "Нейл-бар · Ботанический",
    rating: 4.7,
    reviews: 340,
    occupancy: 50,
    peakHours: "17:00 – 21:00",
    cover: img("photo-1522337660859-02fbefca4702"),
    priceFrom: 5000,
    distanceKm: 1.1,
    services: [
      { name: "Экспресс маникюр", price: 5000, duration: "45 мин" },
      { name: "Маникюр + дизайн", price: 14000, duration: "120 мин" },
      { name: "Педикюр смарт", price: 15000, duration: "90 мин" },
    ],
    coords: { lng: 71.425, lat: 51.12 },
  },
  {
    id: "v8",
    category: "beauty",
    name: "BROW Bar",
    kind: "Броу-бар · Сарыарка",
    rating: 4.9,
    reviews: 512,
    occupancy: 70,
    peakHours: "12:00 – 15:00",
    cover: img("photo-1560869713-7d0a29430803"),
    priceFrom: 4500,
    distanceKm: 3.8,
    badge: "Хит",
    services: [
      { name: "Коррекция + окрашивание", price: 7000, duration: "60 мин" },
      { name: "Ламинирование бровей", price: 12000, duration: "75 мин" },
      { name: "Ламинирование ресниц", price: 14000, duration: "90 мин" },
    ],
    coords: { lng: 71.41, lat: 51.16 },
  },
];

export type CityEvent = {
  id: string;
  title: string;
  place: string;
  date: string;
  time: string;
  cover: string;
  price: number;
  tag: string;
  hot?: boolean;
};

export const cityEvents: CityEvent[] = [
  {
    id: "e1",
    title: "Jazz Night: Astana Quartet",
    place: "The Bus Bar",
    date: "Сб, 4 июля",
    time: "21:00",
    cover: img("photo-1511192336575-5a79af67a629"),
    price: 8000,
    tag: "Концерт",
    hot: true,
  },
  {
    id: "e2",
    title: "Стендап-вечер: Открытый микрофон",
    place: "Loft Comedy",
    date: "Пт, 3 июля",
    time: "20:00",
    cover: img("photo-1585699324551-f6c309eedeca"),
    price: 4000,
    tag: "Стендап",
  },
  {
    id: "e3",
    title: "Фестиваль уличной еды",
    place: "Триатлон-парк",
    date: "Вс, 5 июля",
    time: "12:00",
    cover: img("photo-1555939594-58d7cb561ad1"),
    price: 0,
    tag: "Фестиваль",
    hot: true,
  },
  {
    id: "e4",
    title: "Симфония под открытым небом",
    place: "Ботанический сад",
    date: "Сб, 4 июля",
    time: "19:30",
    cover: img("photo-1465847899084-d164df4dedc6"),
    price: 12000,
    tag: "Классика",
  },
];

export type Story = {
  id: string;
  name: string;
  avatar: string;
  cover: string;
  caption: string;
  viewed: boolean;
};

export const stories: Story[] = [
  {
    id: "st1",
    name: "Айгерим",
    avatar: img("photo-1494790108377-be9c29b29330", 200),
    cover: img("photo-1414235077428-338989a2e8c0", 600),
    caption: "Дегустационный сет в Qazaq Gourmet 😍",
    viewed: false,
  },
  {
    id: "st2",
    name: "Данияр",
    avatar: img("photo-1500648767791-00dcc994a43e", 200),
    cover: img("photo-1558030006-450675393462", 600),
    caption: "Рибай 45 дней. Ничего лишнего.",
    viewed: false,
  },
  {
    id: "st3",
    name: "Мадина",
    avatar: img("photo-1438761681033-6461ffad8d80", 200),
    cover: img("photo-1512058564366-18510be2db19", 600),
    caption: "Selfie вечером — отдельная эстетика",
    viewed: false,
  },
  {
    id: "st4",
    name: "Ерлан",
    avatar: img("photo-1472099645785-5658abf4ff4e", 200),
    cover: img("photo-1511192336575-5a79af67a629", 600),
    caption: "Кто на джаз в субботу?",
    viewed: true,
  },
  {
    id: "st5",
    name: "Асель",
    avatar: img("photo-1534528741775-53994a69daeb", 200),
    cover: img("photo-1555939594-58d7cb561ad1", 600),
    caption: "Фуд-фест на выходных 🌮",
    viewed: true,
  },
];

export const friends = [
  {
    id: "f1",
    name: "Айгерим",
    avatar: img("photo-1494790108377-be9c29b29330", 200),
    lastSeen: "Qazaq Gourmet · 2ч назад",
  },
  {
    id: "f2",
    name: "Данияр",
    avatar: img("photo-1500648767791-00dcc994a43e", 200),
    lastSeen: "Line Brew · вчера",
  },
  {
    id: "f3",
    name: "Мадина",
    avatar: img("photo-1438761681033-6461ffad8d80", 200),
    lastSeen: "Selfie · сейчас",
  },
  {
    id: "f4",
    name: "Ерлан",
    avatar: img("photo-1472099645785-5658abf4ff4e", 200),
    lastSeen: "Eva Wine Cafe · 3ч назад",
  },
  {
    id: "f5",
    name: "Асель",
    avatar: img("photo-1534528741775-53994a69daeb", 200),
    lastSeen: "дома",
  },
];

export const loyaltyCards = [
  {
    id: "c1",
    name: "Qazaq Gourmet",
    tier: "Gold",
    points: 12480,
    gradient: "from-[#17181B] to-[#3A3C42]",
  },
  {
    id: "c2",
    name: "Line Brew",
    tier: "Silver",
    points: 4210,
    gradient: "from-[#4A5160] to-[#7D8595]",
  },
  { id: "c3", name: "Selfie", tier: "Black", points: 890, gradient: "from-[#0B0B0C] to-[#2A2B2F]" },
  {
    id: "c4",
    name: "MILA Beauty Lab",
    tier: "VIP",
    points: 3500,
    gradient: "from-[#7E7A8C] to-[#AAA6B8]",
  },
  {
    id: "c5",
    name: "Lou Lou",
    tier: "Silver",
    points: 1200,
    gradient: "from-[#1D3A30] to-[#3B6352]",
  },
];

export const upcomingActivities = [
  { id: "u1", title: "Ужин в Qazaq Gourmet", when: "Сегодня · 20:00", guests: 4, place: "Qazaq Gourmet" },
  { id: "u2", title: "День рождения Айгерим", when: "Сб · 19:30", guests: 8, place: "Line Brew" },
  { id: "u3", title: "Бранч с командой", when: "Вс · 12:00", guests: 6, place: "Eva Wine Cafe" },
];

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface VisitEntry {
  id: string;
  place: string;
  when: string;
  sum: number;
  color: string;
  items: OrderItem[];
  companions: string[];
  tips: number;
  review: { stars: number; text: string };
}

// Расширенная история (Фаза 3)
export const history: VisitEntry[] = [
  {
    id: "h1",
    place: "Selfie",
    when: "12 мая",
    sum: 24500,
    color: "bg-stone text-ink-2",
    items: [
      { name: "Дим-самы с креветкой", qty: 2, price: 4200 },
      { name: "Утка по-пекински", qty: 1, price: 6800 },
      { name: "Чай зелёный", qty: 2, price: 1200 },
    ],
    companions: ["Айгерим", "Данияр"],
    tips: 2500,
    review: { stars: 5, text: "Идеальный вечер! Дим-самы как в Гонконге" },
  },
  {
    id: "h2",
    place: "Line Brew",
    when: "3 мая",
    sum: 41200,
    color: "bg-stone text-ink-2",
    items: [
      { name: "Рибай Dry Aged 45 дней", qty: 1, price: 21500 },
      { name: "Крафтовое пиво (0.5)", qty: 3, price: 3200 },
      { name: "Трюфельный картофель", qty: 1, price: 4900 },
    ],
    companions: ["Ерлан", "Тимур", "Асель"],
    tips: 4000,
    review: { stars: 5, text: "Лучший стейк в городе, без вариантов" },
  },
  {
    id: "h3",
    place: "Eva Wine Cafe",
    when: "28 апр",
    sum: 9800,
    color: "bg-stone text-ink-2",
    items: [{ name: "Эгг Бенедикт с лососем", qty: 2, price: 4900 }],
    companions: ["Мадина"],
    tips: 1000,
    review: { stars: 4, text: "Уютно, завтрак был отличный" },
  },
  {
    id: "h4",
    place: "Qazaq Gourmet",
    when: "20 апр",
    sum: 36800,
    color: "bg-stone text-ink-2",
    items: [
      { name: "Тартар из говядины «Актобе»", qty: 1, price: 6900 },
      { name: "Бешбармак из ягнёнка", qty: 2, price: 12400 },
      { name: "Баурсаки с трюфельным мёдом", qty: 1, price: 3200 },
    ],
    companions: ["Данияр", "Мадина", "Ерлан"],
    tips: 3500,
    review: { stars: 5, text: "Артем Канцев — гений. Бешбармак божественный" },
  },
  {
    id: "h5",
    place: "Lou Lou",
    when: "14 апр",
    sum: 18300,
    color: "bg-stone text-ink-2",
    items: [
      { name: "Стейк из тунца", qty: 2, price: 3500 },
      { name: "Хлеб Lou Lou", qty: 1, price: 2400 },
      { name: "Chablis, бокал", qty: 2, price: 5200 },
    ],
    companions: ["Асель"],
    tips: 2000,
    review: { stars: 5, text: "Тунец идеальный, а хлеб — ради него стоит вернуться" },
  },
  {
    id: "h6",
    place: "Barbershop TOMB",
    when: "5 апр",
    sum: 9000,
    color: "bg-stone text-ink-2",
    items: [{ name: "Стрижка + укладка", qty: 1, price: 9000 }],
    companions: [],
    tips: 1000,
    review: { stars: 5, text: "Отличный мастер, всё быстро и чётко" },
  },
];

export const calendarEvents: Record<number, { title: string; color: string }[]> = {
  1: [{ title: "Ужин", color: "#F97316" }],
  6: [{ title: "Бранч", color: "#FBBF24" }],
  8: [{ title: "Кофе с Данияром", color: "#EF4444" }],
  10: [{ title: "Ужин в Qazaq Gourmet", color: "#F97316" }],
  14: [{ title: "Selfie: ужин шефа", color: "#8B5CF6" }],
  16: [
    { title: "Ужин с семья", color: "#F97316" },
    { title: "Дегустация вин", color: "#EAB308" },
  ],
  20: [{ title: "Line Brew", color: "#EF4444" }],
  22: [{ title: "День рождения Айгерим", color: "#EC4899" }],
  24: [{ title: "Бранч", color: "#F59E0B" }],
  28: [{ title: "Кофе", color: "#3B82F6" }],
};

export type Booking = {
  id: string;
  place: string;
  cover: string;
  date: string;
  time: string;
  guests: number;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  area?: string;
  amount?: number;
};

export const bookings: Booking[] = [
  {
    id: "b1",
    place: "Qazaq Gourmet",
    cover: img("photo-1578474846511-04ba529f0b88", 400),
    date: "Сегодня",
    time: "20:00",
    guests: 4,
    status: "confirmed",
    area: "Основной зал",
    amount: 24500,
  },
  {
    id: "b2",
    place: "Jazz Night: Astana Quartet",
    cover: img("photo-1511192336575-5a79af67a629", 400),
    date: "Сб, 4 июля",
    time: "21:00",
    guests: 2,
    status: "confirmed",
    area: "The Bus Bar",
    amount: 16000,
  },
  {
    id: "b3",
    place: "Barbershop TOMB",
    cover: img("photo-1585747860715-2ba37e788b70", 400),
    date: "Вс, 6 июля",
    time: "13:00",
    guests: 1,
    status: "pending",
    area: "Стрижка + укладка",
    amount: 9000,
  },
  {
    id: "b4",
    place: "Selfie",
    cover: img("photo-1550966871-3ed3cdb5ed0c", 400),
    date: "12 мая",
    time: "19:30",
    guests: 2,
    status: "completed",
    area: "Основной зал",
    amount: 24500,
  },
  {
    id: "b5",
    place: "Line Brew",
    cover: img("photo-1514933651103-005eec06c04b", 400),
    date: "3 мая",
    time: "20:00",
    guests: 4,
    status: "completed",
    area: "Пати-сад",
    amount: 41200,
  },
  {
    id: "b6",
    place: "Eva Wine Cafe",
    cover: img("photo-1560624052-449f5ddf0c31", 400),
    date: "28 апр",
    time: "10:00",
    guests: 2,
    status: "cancelled",
    area: "Терраса",
    amount: 9800,
  },
];

export const money = (n: number) => `${n.toLocaleString("ru-RU")} ₸`;

/* ── Загруженность (occupancy) ────────────────────────────────────── */
// Универсальная модель заполненности для пинов на карте, столиков и боксов.
export type Occupancy = "available" | "moderate" | "busy";

export const occupancyColor: Record<Occupancy, string> = {
  available: "#2F8A58", // свободно
  moderate: "#B87A14", // скоро освободится
  busy: "#BD3F2C", // занято надолго
};

export const occupancyLabel: Record<Occupancy, string> = {
  available: "Свободно",
  moderate: "Скоро освободится",
  busy: "Занято",
};

/** Детерминированная «загруженность» по id — стабильна между рендерами. */
export function occupancyForId(id: string): Occupancy {
  const hash = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const v = (hash % 100) / 100;
  if (v > 0.7) return "busy";
  if (v > 0.4) return "moderate";
  return "available";
}

/* ── Автомойка (Task 5) ───────────────────────────────────────────── */

export type WashService = {
  id: string;
  name: string;
  price: number;
  duration: string;
  /** Duration in minutes — used for bay scheduling. */
  minutes: number;
};

/**
 * A physical wash bay. State is derived from absolute timestamps so every
 * screen (map marker, sheet, bay board) computes the same answer for "now".
 * - `session`  → a car is being washed until `endsAt`
 * - `hold`     → a reservation starts at `startsAt` (bay is held / reserved
 *                once it is within the hold window)
 */
export type WashBox = {
  id: string;
  label: string;
  session?: { service: string; startedAt: number; endsAt: number };
  hold?: { startsAt: number };
};

export type BayState = "free" | "reserved" | "in_use";

export type BayStatus = {
  state: BayState;
  /** in_use: minutes left, reserved: minutes until reservation */
  minutes: number;
  /** in_use: 0..1 progress of the running wash */
  progress: number;
  /** HH:MM of the next relevant moment (end of wash / reservation start) */
  at?: string;
  service?: string;
};

/** Reservations closer than this hold the bay. */
const HOLD_WINDOW_MIN = 20;

export const hhmm = (t: number) => {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export function bayStatus(box: WashBox, now = Date.now()): BayStatus {
  const s = box.session;
  if (s && now < s.endsAt) {
    return {
      state: "in_use",
      minutes: Math.max(1, Math.ceil((s.endsAt - now) / 60000)),
      progress: Math.min(1, Math.max(0, (now - s.startedAt) / (s.endsAt - s.startedAt))),
      at: hhmm(s.endsAt),
      service: s.service,
    };
  }
  const h = box.hold;
  if (h && h.startsAt > now) {
    const minutes = Math.ceil((h.startsAt - now) / 60000);
    return { state: minutes <= HOLD_WINDOW_MIN ? "reserved" : "free", minutes, progress: 0, at: hhmm(h.startsAt) };
  }
  return { state: "free", minutes: 0, progress: 0 };
}

export type WashAvailability = { free: number; total: number; nextFreeMin: number | null; occupancy: number };

/** Single selector for bay capacity — map, list and sheet all read this. */
export function washAvailability(wash: { boxes: WashBox[] }, now = Date.now()): WashAvailability {
  const states = wash.boxes.map((b) => bayStatus(b, now));
  const free = states.filter((s) => s.state === "free").length;
  const busy = states.filter((s) => s.state === "in_use").map((s) => s.minutes);
  const total = wash.boxes.length;
  return {
    free,
    total,
    nextFreeMin: free > 0 ? 0 : busy.length ? Math.min(...busy) : null,
    occupancy: Math.round(((total - free) / total) * 100),
  };
}

export type CarWash = {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviews: number;
  cover: string;
  priceFrom: number;
  distanceKm: number;
  coords: { lng: number; lat: number };
  services: WashService[];
  boxes: WashBox[];
};

const washServices: WashService[] = [
  { id: "ws1", name: "Комплексная мойка кузова", price: 5000, duration: "40 мин", minutes: 40 },
  { id: "ws3", name: "Чернение шин", price: 2000, duration: "15 мин", minutes: 15 },
  { id: "ws5", name: "Озонирование", price: 8000, duration: "30 мин", minutes: 30 },
  { id: "ws2", name: "Химчистка салона", price: 35000, duration: "4 часа", minutes: 240 },
  { id: "ws4", name: "Полировка кузова", price: 25000, duration: "3 часа", minutes: 180 },
  { id: "ws6", name: "Нанокерамика", price: 180000, duration: "2 дня", minutes: 2880 },
];

const T0 = Date.now();
const min = (m: number) => T0 + m * 60000;

/**
 * Compact bay schedule: "u:<left>:<total>:<service>" = in use,
 * "r:<in>" = reservation starts in N min, "f" = free.
 */
function bays(seed: string, plan: string[]): WashBox[] {
  return plan.map((p, i) => {
    const [kind, a, b, service] = p.split(":");
    const box: WashBox = { id: `${seed}-box${i + 1}`, label: `Бокс ${i + 1}` };
    if (kind === "u") {
      const left = Number(a);
      const total = Number(b);
      box.session = { service, startedAt: min(left - total), endsAt: min(left) };
    }
    if (kind === "r") box.hold = { startsAt: min(Number(a)) };
    if (kind === "f" && a) box.hold = { startsAt: min(Number(a)) };
    return box;
  });
}

export const carWashes: CarWash[] = [
  {
    id: "v3",
    name: "Details Detailing",
    address: "Детейлинг · Кабанбай батыра, 58",
    rating: 4.7,
    reviews: 210,
    cover: img("photo-1607860108855-64acf2078ed9"),
    priceFrom: 5000,
    distanceKm: 0.9,
    coords: { lng: 71.4218, lat: 51.1215 },
    services: washServices,
    boxes: bays("details", ["u:12:40:Комплекс", "f", "r:14", "u:31:60:Полировка", "f:55", "u:4:15:Шины"]),
  },
  {
    id: "mp12",
    name: "Aqua Box",
    address: "Автомойка · Туран, 24",
    rating: 4.6,
    reviews: 164,
    cover: img("photo-1520340356584-f9917d1eea6f", 1000),
    priceFrom: 4000,
    distanceKm: 0.6,
    coords: { lng: 71.4385, lat: 51.1312 },
    services: washServices,
    boxes: bays("aquabox", ["f", "u:22:40:Комплекс", "f", "r:9"]),
  },
  {
    id: "mp10",
    name: "Shine Car Wash",
    address: "Автомойка · Есиль",
    rating: 4.5,
    reviews: 120,
    cover: img("photo-1520340356584-f9917d1eea6f"),
    priceFrom: 4000,
    distanceKm: 2.9,
    coords: { lng: 71.465, lat: 51.158 },
    services: washServices,
    boxes: bays("shine", ["u:9:40:Комплекс", "u:26:40:Комплекс", "r:6", "u:17:30:Озонирование", "u:38:60:Химчистка", "r:12"]),
  },
  {
    id: "mp11",
    name: "Auto Spa Astana",
    address: "Детейлинг · Есиль",
    rating: 4.8,
    reviews: 190,
    cover: img("photo-1552930294-6b595f4c2974"),
    priceFrom: 6000,
    distanceKm: 4.1,
    coords: { lng: 71.472, lat: 51.162 },
    services: washServices,
    boxes: bays("autospa", ["f", "f", "u:18:40:Комплекс", "f:40", "u:7:15:Шины", "f"]),
  },
];

export const carWashById = (id: string) => carWashes.find((c) => c.id === id);

/* ── Плотные данные для карты (Zenly-style) ───────────────────────── */

export type MapPoint = {
  id: string;
  name: string;
  category: "food" | "beauty" | "medicine" | "auto" | "concerts";
  rating: number;
  cover: string;
  coords: { lng: number; lat: number };
  /** Short cuisine / kind line for map-only points. */
  kind?: string;
};

/**
 * Объединённый массив всех точек на карте — рестораны + заведения + дополнительные
 * моковые точки, чтобы карта выглядела «забитой» (20+ точек).
 */
export const mapPoints: MapPoint[] = [
  // Рестораны (из основного массива)
  ...restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    category: "food" as const,
    rating: r.rating,
    cover: r.cover,
    coords: r.coords,
  })),
  // Заведения (из основного массива)
  ...venues.map((v) => ({
    id: v.id,
    name: v.name,
    category: v.category as MapPoint["category"],
    rating: v.rating,
    cover: v.cover,
    coords: v.coords,
  })),
  ...cityEvents.map((event, index) => ({
    id: event.id,
    name: event.title,
    category: "concerts" as const,
    rating: event.hot ? 4.9 : 4.7,
    cover: event.cover,
    coords: [
      { lng: 71.4405, lat: 51.149 },
      { lng: 71.458, lat: 51.154 },
      { lng: 71.405, lat: 51.143 },
      { lng: 71.432, lat: 51.176 },
    ][index],
  })),
  // Дополнительные моковые точки — рестораны
  {
    id: "mp1",
    name: "Sandyq",
    category: "food",
    kind: "Казахская · Левый берег",
    rating: 4.8,
    cover: img("photo-1569058242253-92a9c755a0ec"),
    coords: { lng: 71.43, lat: 51.1608 },
  },
  {
    id: "mp2",
    name: "Navat",
    category: "food",
    kind: "Чайхана · Левый берег",
    rating: 4.5,
    cover: img("photo-1515003197210-e0cd71810b5f"),
    coords: { lng: 71.415, lat: 51.1505 },
  },
  {
    id: "mp3",
    name: "Black Duck",
    category: "food",
    kind: "Авторская кухня · Туран",
    rating: 4.6,
    cover: img("photo-1517248135467-4c7edcad34c4"),
    coords: { lng: 71.455, lat: 51.132 },
  },
  {
    id: "mp4",
    name: "The Barley",
    category: "food",
    kind: "Паб · крафт",
    rating: 4.7,
    cover: img("photo-1541544741938-0af808871cc0"),
    coords: { lng: 71.426, lat: 51.1395 },
  },
  {
    id: "mp5",
    name: "Coffee Boom",
    category: "food",
    kind: "Кофейня · завтраки",
    rating: 4.9,
    cover: img("photo-1501339847302-ac426a4a7cbb"),
    coords: { lng: 71.438, lat: 51.127 },
  },
  // Дополнительные — барбершопы / салоны
  {
    id: "mp6",
    name: "Gentlemen's Club",
    category: "beauty",
    kind: "Барбершоп",
    rating: 4.8,
    cover: img("photo-1503951914875-452162b0f3f1"),
    coords: { lng: 71.421, lat: 51.1362 },
  },
  {
    id: "mp7",
    name: "Lash Bar",
    category: "beauty",
    kind: "Ресницы и брови",
    rating: 4.9,
    cover: img("photo-1522337660859-02fbefca4702"),
    coords: { lng: 71.448, lat: 51.1418 },
  },
  // Дополнительные — стоматологии / медицина
  {
    id: "mp8",
    name: "Dent Studio",
    category: "medicine",
    kind: "Стоматология",
    rating: 4.7,
    cover: img("photo-1629909613654-28e377c37b09"),
    coords: { lng: 71.433, lat: 51.1512 },
  },
  {
    id: "mp9",
    name: "Medilux",
    category: "medicine",
    kind: "Клиника",
    rating: 4.6,
    cover: img("photo-1519494026892-80bbd2d6fd0d"),
    coords: { lng: 71.419, lat: 51.1438 },
  },
  // Автомойки — из единого источника боксов
  ...carWashes
    .filter((w) => !venues.some((v) => v.id === w.id))
    .map((w) => ({ id: w.id, name: w.name, category: "auto" as const, rating: w.rating, cover: w.cover, coords: w.coords })),
  // Реальные заведения Астаны рядом с пользователем (загрузка — оценка)
  { id: "mp13", name: "Del Papa", category: "food", kind: "Итальянская · Кабанбай батыра", rating: 4.7, cover: img("photo-1555396273-367ea4eb4db5"), coords: { lng: 71.4262, lat: 51.1236 } },
  { id: "mp14", name: "Rumi", category: "food", kind: "Восточная · Левый берег", rating: 4.8, cover: img("photo-1552566626-52f8b828add9"), coords: { lng: 71.4351, lat: 51.1248 } },
  { id: "mp15", name: "Kishlak", category: "food", kind: "Узбекская · Левый берег", rating: 4.6, cover: img("photo-1590846406792-0adc7f938f1d"), coords: { lng: 71.4198, lat: 51.1301 } },
  { id: "mp16", name: "Mad Murphy's", category: "food", kind: "Ирландский паб · Левый берег", rating: 4.5, cover: img("photo-1514933651103-005eec06c04b"), coords: { lng: 71.4412, lat: 51.1284 } },
  { id: "mp17", name: "Chocolatte", category: "food", kind: "Кофейня · десерты", rating: 4.6, cover: img("photo-1554118811-1e0d58224f24"), coords: { lng: 71.4288, lat: 51.1329 } },
  { id: "mp18", name: "Barashek", category: "food", kind: "Казахская · мясо", rating: 4.7, cover: img("photo-1559339352-11d035aa65de"), coords: { lng: 71.4156, lat: 51.1244 } },
];

// Distances are derived from coordinates, never hand-typed.
[...restaurants, ...venues, ...carWashes].forEach((x) => {
  x.distanceKm = Math.max(0.1, distanceKm(x.coords));
});

export type FriendMapLocation = {
  id: string;
  name: string;
  avatar: string;
  coords: { lng: number; lat: number };
  minutesAgo: number;
};

/**
 * 8 плавающих аватарок друзей в стиле Zenly — распределены по всей Астане.
 */
export const friendMapLocations: FriendMapLocation[] = [
  {
    id: "fm1",
    name: "Айгерим",
    avatar: img("photo-1494790108377-be9c29b29330", 200),
    coords: { lng: 71.4225, lat: 51.129 },
    minutesAgo: 5,
  },
  {
    id: "fm2",
    name: "Данияр",
    avatar: img("photo-1500648767791-00dcc994a43e", 200),
    coords: { lng: 71.428, lat: 51.1285 },
    minutesAgo: 12,
  },
  {
    id: "fm3",
    name: "Мадина",
    avatar: img("photo-1438761681033-6461ffad8d80", 200),
    coords: { lng: 71.408, lat: 51.1325 },
    minutesAgo: 3,
  },
  {
    id: "fm4",
    name: "Ерлан",
    avatar: img("photo-1472099645785-5658abf4ff4e", 200),
    coords: { lng: 71.44, lat: 51.1555 },
    minutesAgo: 28,
  },
  {
    id: "fm5",
    name: "Асель",
    avatar: img("photo-1534528741775-53994a69daeb", 200),
    coords: { lng: 71.435, lat: 51.162 },
    minutesAgo: 45,
  },
  {
    id: "fm6",
    name: "Тимур",
    avatar: img("photo-1507003211169-0a1dd7228f2d", 200),
    coords: { lng: 71.415, lat: 51.138 },
    minutesAgo: 8,
  },
  {
    id: "fm7",
    name: "Дана",
    avatar: img("photo-1487412720507-e7ab37603c6f", 200),
    coords: { lng: 71.452, lat: 51.149 },
    minutesAgo: 15,
  },
  {
    id: "fm8",
    name: "Нурлан",
    avatar: img("photo-1519085360753-af0119f7cbe7", 200),
    coords: { lng: 71.425, lat: 51.145 },
    minutesAgo: 60,
  },
];
