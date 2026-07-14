export const MAPBOX_TOKEN =
  "pk.eyJ1Ijoic3VsdGVlbiIsImEiOiJjbHVqbWJtYWkwNXhiMmxvMWwxOW9kZG9sIn0.8aHVOkgsFBDYnN9FBVNcPw";

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
  ingredients?: string[];
  protein?: number;
  fat?: number;
  carbs?: number;
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
  occupancy: number;
  peakHours: string;
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
    occupancy: 85,
    peakHours: "19:00 – 22:00",
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
            name: "Ауылский чай",
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
    cuisine: "Стейк-хаус",
    district: "Байтерек, Астана",
    avgCheck: 25000,
    rating: 4.8,
    reviews: 942,
    distanceKm: 2.4,
    occupancy: 60,
    peakHours: "20:00 – 23:00",
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
    name: "Неделька",
    cuisine: "Европейская",
    district: "Left Bank",
    avgCheck: 12000,
    rating: 4.7,
    reviews: 610,
    distanceKm: 0.8,
    occupancy: 95,
    peakHours: "09:00 – 12:00",
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
    name: "Sadu",
    cuisine: "Паназиатская",
    district: "Хан Шатыр",
    avgCheck: 15000,
    rating: 4.6,
    reviews: 320,
    distanceKm: 3.1,
    occupancy: 100,
    peakHours: "19:00 – 21:00",
    cover: img("photo-1552566626-52f8b828add9"),
    gallery: [img("photo-1512058564366-18510be2db19")],
    coords: { lng: 71.408, lat: 51.132 },
    description: "Дим-самы, роботы-повара и коктейли на робате.",
    tags: ["Азия", "Коктейли"],
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
    name: "Марракеш",
    cuisine: "Марокканская",
    district: "Сарыарка, Астана",
    avgCheck: 14000,
    rating: 4.5,
    reviews: 412,
    distanceKm: 4.2,
    occupancy: 45,
    peakHours: "18:00 – 21:00",
    cover: img("photo-1541518763669-27fef04b14ea"),
    gallery: [img("photo-1511690656952-34342bb7c2f2"), img("photo-1414235077428-338989a2e8c0")],
    coords: { lng: 71.415, lat: 51.155 },
    description: "Атмосфера восточной сказки. Настоящие тажины, кускус и мятный чай.",
    tags: ["Восток", "Кальян", "Мясо"],
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
    name: "Кинза",
    cuisine: "Грузинская",
    district: "Алматы, Астана",
    avgCheck: 10000,
    rating: 4.8,
    reviews: 875,
    distanceKm: 2.8,
    occupancy: 90,
    peakHours: "18:30 – 21:30",
    cover: img("photo-1517248135467-4c7edcad34c4"),
    gallery: [
      img("photo-1517248135467-4c7edcad34c4"),
      img("photo-1565299624946-b28f40a0ae38"),
      img("photo-1559339352-11b0d566a44a"),
    ],
    coords: { lng: 71.46, lat: 51.14 },
    description: "Настоящая грузинская кухня: хинкали, хачапури из дровяной печи и домашнее вино.",
    tags: ["Хинкали", "Вино", "Выпечка"],
    menu: [
      {
        section: "Хинкали",
        items: [
          {
            id: "kz1",
            name: "Хинкали Калакури (5 шт)",
            desc: "Говядина/свинина, зелень, специи",
            price: 3500,
            weight: 450,
            kcal: 950,
            tags: ["мясо", "хит 🔥"],
            image: img("photo-1544025162-d76694265947"),
            ingredients: ["мука", "говядина", "свинина", "лук", "кинза", "специи"],
            protein: 35,
            fat: 45,
            carbs: 90,
          },
          {
            id: "kz2",
            name: "Хинкали с сыром сулугуни (5 шт)",
            desc: "Домашний сыр сулугуни, сливочное масло",
            price: 3800,
            weight: 450,
            kcal: 1100,
            tags: ["веган 🌱"],
            image: img("photo-1509440159596-0249088772ff"),
            ingredients: ["мука", "сыр сулугуни", "сливочное масло"],
            protein: 45,
            fat: 60,
            carbs: 85,
          },
        ],
      },
      {
        section: "Выпечка",
        items: [
          {
            id: "kz3",
            name: "Хачапури по-аджарски",
            desc: "Лодочка из теста, сыр сулугуни, желток, сливочное масло",
            price: 3200,
            weight: 350,
            kcal: 850,
            tags: ["выпечка", "хит 🔥"],
            image: img("photo-1546069901-ba9599a7e63c"),
            ingredients: ["мука", "сыр сулугуни", "имеретинский сыр", "яйцо", "сливочное масло"],
            protein: 38,
            fat: 45,
            carbs: 75,
          },
        ],
      },
      {
        section: "Горячее",
        items: [
          {
            id: "kz4",
            name: "Оджахури на кеци",
            desc: "Жареная свинина, картофель, лук, томаты, специи, зелень",
            price: 4500,
            weight: 400,
            kcal: 750,
            tags: ["свинина", "сытное"],
            image: img("photo-1519708227418-c8fd9a32b7a2"),
            ingredients: ["свинина", "картофель", "лук", "томаты", "чеснок", "кинза"],
            protein: 42,
            fat: 50,
            carbs: 35,
          },
        ],
      },
      {
        section: "Напитки",
        items: [
          {
            id: "kz5",
            name: "Домашнее гранатовое вино (0.5л)",
            desc: "Полусладкое вино из граната",
            price: 4500,
            weight: 500,
            kcal: 400,
            tags: ["вино", "хит 🔥"],
            image: img("photo-1558030006-450675393462"),
            ingredients: ["виноград", "гранатовый сок"],
            protein: 0,
            fat: 0,
            carbs: 45,
          },
        ],
      },
    ],
    specials: [
      {
        id: "s_kinza",
        name: "Грузинское застолье",
        desc: "Ассорти шашлыков, хачапури, 2 вида хинкали, кувшин вина",
        price: 25000,
        weight: 0,
        kcal: 0,
        tags: ["на компанию"],
        image: img("photo-1544025162-d76694265947"),
        special: "Выгодно",
      },
    ],
  },
];

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
    kind: "Автомойка · Left Bank",
    rating: 4.7,
    reviews: 210,
    occupancy: 95,
    peakHours: "12:00 – 16:00",
    cover: img("photo-1607860108855-64acf2078ed9"),
    priceFrom: 5000,
    distanceKm: 3.4,
    services: [
      { name: "Комплекс мойка", price: 5000, duration: "40 мин" },
      { name: "Химчистка салона", price: 35000, duration: "4 часа" },
      { name: "Керамика кузова", price: 180000, duration: "2 дня" },
    ],
    coords: { lng: 71.46, lat: 51.15 },
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
    caption: "Дегустационный сет в Ауыл 😍",
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
    caption: "Sadu вечером — отдельная эстетика",
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
    lastSeen: "Ауыл · 2ч назад",
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
    lastSeen: "Sadu · сейчас",
  },
  {
    id: "f4",
    name: "Ерлан",
    avatar: img("photo-1472099645785-5658abf4ff4e", 200),
    lastSeen: "Неделька · 3ч назад",
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
    name: "Ауыл",
    tier: "Gold",
    points: 12480,
    gradient: "from-neutral-900 to-neutral-700",
  },
  {
    id: "c2",
    name: "Line Brew",
    tier: "Silver",
    points: 4210,
    gradient: "from-[#F97316] to-[#EA580C]",
  },
  { id: "c3", name: "Sadu", tier: "Black", points: 890, gradient: "from-zinc-800 to-black" },
  {
    id: "c4",
    name: "MILA Beauty Lab",
    tier: "VIP",
    points: 3500,
    gradient: "from-pink-500 to-rose-600",
  },
  {
    id: "c5",
    name: "Кинза",
    tier: "Silver",
    points: 1200,
    gradient: "from-red-600 to-red-800",
  },
];

export const upcomingActivities = [
  { id: "u1", title: "Ужин в Ауыл", when: "Сегодня · 20:00", guests: 4, place: "Ауыл" },
  { id: "u2", title: "День рождения Айгерим", when: "Сб · 19:30", guests: 8, place: "Line Brew" },
  { id: "u3", title: "Бранч с командой", when: "Вс · 12:00", guests: 6, place: "Неделька" },
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
    place: "Sadu",
    when: "12 мая",
    sum: 24500,
    color: "bg-rose-100 text-rose-500",
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
    color: "bg-orange-100 text-orange-500",
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
    place: "Неделька",
    when: "28 апр",
    sum: 9800,
    color: "bg-emerald-100 text-emerald-500",
    items: [{ name: "Эгг Бенедикт с лососем", qty: 2, price: 4900 }],
    companions: ["Мадина"],
    tips: 1000,
    review: { stars: 4, text: "Уютно, завтрак был отличный" },
  },
  {
    id: "h4",
    place: "Ауыл",
    when: "20 апр",
    sum: 36800,
    color: "bg-violet-100 text-violet-500",
    items: [
      { name: "Тартар из говядины «Актобе»", qty: 1, price: 6900 },
      { name: "Бешбармак из ягнёнка", qty: 2, price: 12400 },
      { name: "Баурсаки с трюфельным мёдом", qty: 1, price: 3200 },
    ],
    companions: ["Данияр", "Мадина", "Ерлан"],
    tips: 3500,
    review: { stars: 5, text: "Шеф Дидар — гений. Бешбармак божественный" },
  },
  {
    id: "h5",
    place: "Кинза",
    when: "14 апр",
    sum: 18300,
    color: "bg-amber-100 text-amber-500",
    items: [
      { name: "Хинкали Калакури (5 шт)", qty: 2, price: 3500 },
      { name: "Хачапури по-аджарски", qty: 1, price: 3200 },
      { name: "Домашнее гранатовое вино", qty: 1, price: 4500 },
    ],
    companions: ["Асель"],
    tips: 2000,
    review: { stars: 5, text: "Хинкали сочные, хачапури тает во рту" },
  },
  {
    id: "h6",
    place: "Barbershop TOMB",
    when: "5 апр",
    sum: 9000,
    color: "bg-sky-100 text-sky-500",
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
  10: [{ title: "Ужин в Ауыл", color: "#F97316" }],
  14: [{ title: "Sadu takeover", color: "#8B5CF6" }],
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
    place: "Ауыл",
    cover: img("photo-1518837695005-2083093ee35b", 400),
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
    place: "Sadu",
    cover: img("photo-1555396273-367ea4eb4db5", 400),
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
    cover: img("photo-1544025162-c77340a6f9c9", 400),
    date: "3 мая",
    time: "20:00",
    guests: 4,
    status: "completed",
    area: "Пати-сад",
    amount: 41200,
  },
  {
    id: "b6",
    place: "Неделька",
    cover: img("photo-1551218808-94e220e084d2", 400),
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
  available: "#22C55E", // зелёный — свободно
  moderate: "#F59E0B", // оранжевый — скоро освободится
  busy: "#EF4444", // красный — занято надолго
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
};

export type WashBox = {
  id: string;
  label: string;
  status: Occupancy;
  /** Время освобождения, напр. "14:30" — только для занятых боксов. */
  freeAt?: string;
  /** Прогресс текущей мойки 0..1 — сколько времени прошло. */
  progress?: number;
};

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
  { id: "ws1", name: "Комплексная мойка кузова", price: 5000, duration: "40 мин" },
  { id: "ws2", name: "Химчистка салона", price: 35000, duration: "4 часа" },
  { id: "ws3", name: "Чернение шин", price: 2000, duration: "15 мин" },
  { id: "ws4", name: "Полировка кузова", price: 25000, duration: "3 часа" },
  { id: "ws5", name: "Озонирование", price: 8000, duration: "30 мин" },
  { id: "ws6", name: "Нанокерамика", price: 180000, duration: "2 дня" },
];

const makeBoxes = (seed: string): WashBox[] =>
  Array.from({ length: 6 }, (_, i) => {
    const id = `${seed}-box${i + 1}`;
    const status = occupancyForId(id);
    const busy = status !== "available";
    const progress = status === "busy" ? 0.25 + (i % 3) * 0.15 : status === "moderate" ? 0.7 : 0;
    const freeMin = status === "busy" ? 25 + i * 6 : status === "moderate" ? 8 + i * 2 : 0;
    const free = new Date(Date.now() + freeMin * 60000);
    return {
      id,
      label: `Бокс ${i + 1}`,
      status,
      progress: busy ? progress : undefined,
      freeAt: busy
        ? `${String(free.getHours()).padStart(2, "0")}:${String(free.getMinutes()).padStart(2, "0")}`
        : undefined,
    };
  });

export const carWashes: CarWash[] = [
  {
    id: "v3",
    name: "Details Detailing",
    address: "Автомойка · Left Bank",
    rating: 4.7,
    reviews: 210,
    cover: img("photo-1607860108855-64acf2078ed9"),
    priceFrom: 5000,
    distanceKm: 3.4,
    coords: { lng: 71.46, lat: 51.15 },
    services: washServices,
    boxes: makeBoxes("details"),
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
    boxes: makeBoxes("shine"),
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
    boxes: makeBoxes("autospa"),
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
    rating: 4.8,
    cover: img("photo-1569058242253-92a9c755a0ec"),
    coords: { lng: 71.43, lat: 51.1608 },
  },
  {
    id: "mp2",
    name: "Ashana",
    category: "food",
    rating: 4.5,
    cover: img("photo-1515003197210-e0cd71810b5f"),
    coords: { lng: 71.415, lat: 51.1505 },
  },
  {
    id: "mp3",
    name: "Marina Bay",
    category: "food",
    rating: 4.6,
    cover: img("photo-1517248135467-4c7edcad34c4"),
    coords: { lng: 71.455, lat: 51.132 },
  },
  {
    id: "mp4",
    name: "Beirut",
    category: "food",
    rating: 4.7,
    cover: img("photo-1541544741938-0af808871cc0"),
    coords: { lng: 71.426, lat: 51.1395 },
  },
  {
    id: "mp5",
    name: "Fusion Coffee",
    category: "food",
    rating: 4.9,
    cover: img("photo-1501339847302-ac426a4a7cbb"),
    coords: { lng: 71.438, lat: 51.127 },
  },
  // Дополнительные — барбершопы / салоны
  {
    id: "mp6",
    name: "Gentlemen's Club",
    category: "beauty",
    rating: 4.8,
    cover: img("photo-1503951914875-452162b0f3f1"),
    coords: { lng: 71.421, lat: 51.1362 },
  },
  {
    id: "mp7",
    name: "Lash Bar",
    category: "beauty",
    rating: 4.9,
    cover: img("photo-1522337660859-02fbefca4702"),
    coords: { lng: 71.448, lat: 51.1418 },
  },
  // Дополнительные — стоматологии / медицина
  {
    id: "mp8",
    name: "Dent Studio",
    category: "medicine",
    rating: 4.7,
    cover: img("photo-1629909613654-28e377c37b09"),
    coords: { lng: 71.433, lat: 51.1512 },
  },
  {
    id: "mp9",
    name: "Medilux",
    category: "medicine",
    rating: 4.6,
    cover: img("photo-1519494026892-80bbd2d6fd0d"),
    coords: { lng: 71.419, lat: 51.1438 },
  },
  // Дополнительные — автомойки / авто
  {
    id: "mp10",
    name: "Shine Car Wash",
    category: "auto",
    rating: 4.5,
    cover: img("photo-1520340356584-f9917d1eea6f"),
    coords: { lng: 71.465, lat: 51.158 },
  },
  {
    id: "mp11",
    name: "Auto Spa Astana",
    category: "auto",
    rating: 4.8,
    cover: img("photo-1552930294-6b595f4c2974"),
    coords: { lng: 71.472, lat: 51.162 },
  },
];

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
    avatar: img("photo-1506794778202-cad84cf4531c", 200),
    coords: { lng: 71.425, lat: 51.145 },
    minutesAgo: 60,
  },
];
