import { img } from "./hostess";

/* ── Клиники и стоматологии: направления, врачи, симптомы, шахматка ── */

export type DirectionId =
  | "dental-therapy"
  | "dental-hygiene"
  | "dental-surgery"
  | "orthodontics"
  | "therapy"
  | "neurology"
  | "ent"
  | "cardiology"
  | "pediatrics";

export type ClinicService = {
  id: string;
  name: string;
  /** Базовая цена; у врача умножается на его коэффициент. */
  price: number;
  minutes: number;
  /** Первичный приём — с него начинается запись «по симптому». */
  first?: boolean;
};

export type Direction = {
  id: DirectionId;
  label: string;
  /** Как называется врач: «стоматолог-терапевт». */
  specialist: string;
  services: ClinicService[];
};

export const directions: Record<DirectionId, Direction> = {
  "dental-therapy": {
    id: "dental-therapy",
    label: "Лечение зубов",
    specialist: "Стоматолог-терапевт",
    services: [
      { id: "dt-exam", name: "Осмотр + прицельный снимок", price: 8000, minutes: 30, first: true },
      { id: "dt-caries", name: "Лечение кариеса", price: 28000, minutes: 60 },
      { id: "dt-canal", name: "Лечение каналов", price: 55000, minutes: 90 },
    ],
  },
  "dental-hygiene": {
    id: "dental-hygiene",
    label: "Гигиена и дёсны",
    specialist: "Гигиенист",
    services: [
      { id: "dh-clean", name: "Профгигиена + AirFlow", price: 25000, minutes: 60, first: true },
      { id: "dh-gums", name: "Консультация пародонтолога", price: 9000, minutes: 30 },
      { id: "dh-white", name: "Отбеливание ZOOM 4", price: 120000, minutes: 90 },
    ],
  },
  "dental-surgery": {
    id: "dental-surgery",
    label: "Хирургия и импланты",
    specialist: "Хирург-имплантолог",
    services: [
      { id: "ds-consult", name: "Консультация + КТ", price: 15000, minutes: 40, first: true },
      { id: "ds-extract", name: "Удаление зуба", price: 22000, minutes: 45 },
      { id: "ds-implant", name: "Имплант Osstem под ключ", price: 290000, minutes: 90 },
    ],
  },
  orthodontics: {
    id: "orthodontics",
    label: "Ортодонтия",
    specialist: "Ортодонт",
    services: [
      { id: "or-consult", name: "Консультация + слепки", price: 12000, minutes: 40, first: true },
      { id: "or-aligners", name: "Элайнеры: план лечения", price: 45000, minutes: 60 },
      { id: "or-braces", name: "Брекет-система (челюсть)", price: 350000, minutes: 120 },
    ],
  },
  therapy: {
    id: "therapy",
    label: "Терапия",
    specialist: "Терапевт",
    services: [
      { id: "th-visit", name: "Первичный приём терапевта", price: 9000, minutes: 30, first: true },
      { id: "th-repeat", name: "Повторный приём", price: 6500, minutes: 20 },
      { id: "th-checkup", name: "Check-up «Базовый»", price: 45000, minutes: 120 },
    ],
  },
  neurology: {
    id: "neurology",
    label: "Неврология",
    specialist: "Невролог",
    services: [
      { id: "ne-visit", name: "Консультация невролога", price: 12000, minutes: 40, first: true },
      { id: "ne-block", name: "Медикаментозная блокада", price: 18000, minutes: 30 },
      { id: "ne-mri", name: "МРТ позвоночника (отдел)", price: 32000, minutes: 40 },
    ],
  },
  ent: {
    id: "ent",
    label: "ЛОР",
    specialist: "Оториноларинголог",
    services: [
      { id: "en-visit", name: "Осмотр ЛОР-врача", price: 10000, minutes: 30, first: true },
      { id: "en-wash", name: "Промывание миндалин", price: 7000, minutes: 20 },
      { id: "en-endo", name: "Эндоскопия носоглотки", price: 14000, minutes: 30 },
    ],
  },
  cardiology: {
    id: "cardiology",
    label: "Кардиология",
    specialist: "Кардиолог",
    services: [
      { id: "ca-visit", name: "Приём кардиолога + ЭКГ", price: 15000, minutes: 40, first: true },
      { id: "ca-echo", name: "ЭхоКГ (УЗИ сердца)", price: 16000, minutes: 40 },
      { id: "ca-holter", name: "Холтер на 24 часа", price: 22000, minutes: 20 },
    ],
  },
  pediatrics: {
    id: "pediatrics",
    label: "Педиатрия",
    specialist: "Педиатр",
    services: [
      { id: "pe-visit", name: "Приём педиатра", price: 10000, minutes: 30, first: true },
      { id: "pe-home", name: "Справка в сад / школу", price: 5000, minutes: 20 },
      { id: "pe-vacc", name: "Вакцинация (без вакцины)", price: 6000, minutes: 20 },
    ],
  },
};

export type SymptomIcon =
  | "tooth"
  | "sparkles"
  | "droplet"
  | "smile"
  | "shield"
  | "thermometer"
  | "ear"
  | "spine"
  | "brain"
  | "heart"
  | "baby"
  | "clipboard";

export type Symptom = {
  id: string;
  label: string;
  icon: SymptomIcon;
  direction: DirectionId;
  /** Почему это направление — одна строка под рекомендацией. */
  hint: string;
  /** Срочность: показываем «лучше сегодня» и сортируем слоты. */
  urgent?: boolean;
  bring: string[];
};

export const symptoms: Symptom[] = [
  {
    id: "toothache",
    label: "Болит зуб",
    icon: "tooth",
    direction: "dental-therapy",
    hint: "Врач осмотрит зуб, сделает прицельный снимок и скажет, что лечить и сколько это стоит.",
    urgent: true,
    bring: [
      "Удостоверение личности",
      "Прошлые снимки, если есть",
      "Список лекарств, которые принимали",
    ],
  },
  {
    id: "cleaning",
    label: "Чистка зубов",
    icon: "sparkles",
    direction: "dental-hygiene",
    hint: "Ультразвук, AirFlow и полировка. Рекомендуют раз в полгода.",
    bring: ["Удостоверение личности"],
  },
  {
    id: "gums",
    label: "Кровоточат дёсны",
    icon: "droplet",
    direction: "dental-hygiene",
    hint: "Чаще всего причина — зубной камень. Начнём с осмотра и гигиены.",
    bring: ["Удостоверение личности", "Список лекарств, которые принимаете"],
  },
  {
    id: "implant",
    label: "Нет зуба",
    icon: "shield",
    direction: "dental-surgery",
    hint: "На консультации сделают КТ и предложат имплант или мост, с ценой и сроками.",
    bring: ["Удостоверение личности", "Прошлые снимки и КТ, если есть"],
  },
  {
    id: "braces",
    label: "Кривые зубы",
    icon: "smile",
    direction: "orthodontics",
    hint: "Ортодонт снимет слепки и сравнит брекеты и элайнеры.",
    bring: ["Удостоверение личности", "Панорамный снимок, если есть"],
  },
  {
    id: "cold",
    label: "Простуда",
    icon: "thermometer",
    direction: "therapy",
    hint: "Терапевт осмотрит, при необходимости назначит анализы и даст больничный.",
    urgent: true,
    bring: ["Удостоверение личности", "Маска", "Результаты анализов, если есть"],
  },
  {
    id: "throat",
    label: "Горло и уши",
    icon: "ear",
    direction: "ent",
    hint: "ЛОР-врач осмотрит горло, нос и уши с эндоскопом.",
    urgent: true,
    bring: ["Удостоверение личности", "Маска"],
  },
  {
    id: "back",
    label: "Спина",
    icon: "spine",
    direction: "neurology",
    hint: "Невролог проверит рефлексы и подвижность и решит, нужна ли МРТ.",
    bring: ["Удостоверение личности", "МРТ или рентген, если делали", "Удобная одежда"],
  },
  {
    id: "headache",
    label: "Головная боль",
    icon: "brain",
    direction: "neurology",
    hint: "Невролог поможет понять причину и подобрать лечение.",
    bring: ["Удостоверение личности", "Дневник давления, если ведёте"],
  },
  {
    id: "heart",
    label: "Давление",
    icon: "heart",
    direction: "cardiology",
    hint: "Кардиолог снимет ЭКГ прямо на приёме.",
    bring: ["Удостоверение личности", "Дневник давления", "Прошлые ЭКГ"],
  },
  {
    id: "kid",
    label: "Ребёнок заболел",
    icon: "baby",
    direction: "pediatrics",
    hint: "Педиатр примет ребёнка с рождения до 18 лет.",
    urgent: true,
    bring: ["Свидетельство о рождении", "Прививочный паспорт", "Сменная обувь"],
  },
  {
    id: "checkup",
    label: "Check-up",
    icon: "clipboard",
    direction: "therapy",
    hint: "Начнём с терапевта: он составит программу обследования под вас.",
    bring: ["Удостоверение личности", "Прийти натощак, если будут анализы"],
  },
];

export type DoctorReview = {
  author: string;
  date: string;
  rating: number;
  text: string;
};

export type Doctor = {
  id: string;
  clinicId: string;
  name: string;
  direction: DirectionId;
  /** Уточнение к специализации: «эндодонтия, микроскоп». */
  focus: string;
  photo: string;
  experienceYears: number;
  category: string;
  about: string;
  education: string[];
  languages: string[];
  rating: number;
  reviewsCount: number;
  reviews: DoctorReview[];
  /** Коэффициент цены относительно прайса направления. */
  priceFactor: number;
  /** Загруженность 0…1 — сколько слотов уже занято. */
  load: number;
  /** Дни недели без приёма (0 — вс). */
  daysOff: number[];
};

export type Clinic = {
  id: string;
  name: string;
  kind: "Стоматология" | "Многопрофильная клиника";
  district: string;
  address: string;
  cover: string;
  gallery: string[];
  rating: number;
  reviews: number;
  distanceKm: number;
  about: string;
  hours: { open: number; close: number; sunday: [number, number] | null };
  perks: string[];
  coords: { lng: number; lat: number };
};

/** id совпадают с `venues` и `mapPoints` — карта и каталог открывают ту же клинику. */
export const clinics: Clinic[] = [
  {
    id: "v2",
    name: "Dr. Aidyn Clinic",
    kind: "Стоматология",
    district: "Байтерек",
    address: "пр. Мангилик Ел, 28 · 2 этаж",
    cover: img("photo-1629909613654-28e377c37b09"),
    gallery: [
      img("photo-1629909613654-28e377c37b09"),
      img("photo-1598256989800-fe5f95da9787"),
      img("photo-1588776814546-1ffcf47267a5"),
    ],
    rating: 4.8,
    reviews: 320,
    distanceKm: 2.1,
    about:
      "Стоматология полного цикла: лечение под микроскопом, своя КТ и имплантация за один визит. Перед любым лечением — план с ценой, без сюрпризов.",
    hours: { open: 9, close: 20, sunday: [10, 15] },
    perks: ["КТ на месте", "Лечение под микроскопом", "Детское кресло", "Парковка"],
    coords: { lng: 71.435, lat: 51.14 },
  },
  {
    id: "mp8",
    name: "Dent Studio",
    kind: "Стоматология",
    district: "Есиль",
    address: "ул. Кабанбай батыра, 11/5",
    cover: img("photo-1629909615184-74f495363b67"),
    gallery: [
      img("photo-1629909615184-74f495363b67"),
      img("photo-1609840114035-3c981b782dfe"),
      img("photo-1606811971618-4486d14f3f99"),
    ],
    rating: 4.7,
    reviews: 188,
    distanceKm: 1.4,
    about:
      "Эстетическая стоматология: гигиена, элайнеры, виниры. Спокойные кабинеты, кофе и плед. Подходит тем, кто боится стоматологов.",
    hours: { open: 9, close: 19, sunday: null },
    perks: ["Элайнеры", "Седация", "Безналичная оплата", "Рассрочка 0-0-12"],
    coords: { lng: 71.433, lat: 51.1512 },
  },
  {
    id: "v5",
    name: "NurLife Clinic",
    kind: "Многопрофильная клиника",
    district: "Алматы",
    address: "ул. Сарыарка, 6 · БЦ Arman",
    cover: img("photo-1519494026892-80bbd2d6fd0d"),
    gallery: [
      img("photo-1519494026892-80bbd2d6fd0d"),
      img("photo-1631248055158-edec7a3c072b"),
      img("photo-1551076805-e1869033e561"),
    ],
    rating: 4.6,
    reviews: 245,
    distanceKm: 5.1,
    about:
      "Семейная клиника: терапевты, педиатры и неврологи в одном месте. Анализы сдаются на месте, результаты приходят в приложение.",
    hours: { open: 8, close: 20, sunday: [9, 14] },
    perks: ["Лаборатория", "Больничный лист", "Приём детей", "Лифт"],
    coords: { lng: 71.47, lat: 51.145 },
  },
  {
    id: "mp9",
    name: "Medilux",
    kind: "Многопрофильная клиника",
    district: "Сарыарка",
    address: "пр. Республики, 54",
    cover: img("photo-1586773860418-d37222d8fce3"),
    gallery: [
      img("photo-1586773860418-d37222d8fce3"),
      img("photo-1666214280250-41f16ba24a26"),
      img("photo-1631815588090-d4bfec5b1ccb"),
    ],
    rating: 4.6,
    reviews: 412,
    distanceKm: 3.3,
    about:
      "Диагностический центр: кардиология, ЛОР, неврология и своя МРТ 1.5 Тл. Можно пройти обследование за один день.",
    hours: { open: 8, close: 21, sunday: [9, 17] },
    perks: ["МРТ 1.5 Тл", "ЭКГ и ЭхоКГ", "Страховки ДМС", "Парковка"],
    coords: { lng: 71.419, lat: 51.1438 },
  },
];

const r = (author: string, date: string, rating: number, text: string): DoctorReview => ({
  author,
  date,
  rating,
  text,
});

export const doctors: Doctor[] = [
  /* Dr. Aidyn Clinic */
  {
    id: "doc-nurlanova",
    clinicId: "v2",
    name: "Айгерим Нурланова",
    direction: "dental-therapy",
    focus: "Эндодонтия под микроскопом",
    photo: img("photo-1594824476967-48c8b964273f", 800),
    experienceYears: 12,
    category: "Высшая категория",
    about:
      "Лечит каналы под микроскопом Carl Zeiss и спасает зубы, которые другие советуют удалить. Подробно объясняет план лечения и показывает снимки на экране.",
    education: ["КазНМУ им. Асфендиярова, 2013", "Курс эндодонтии, Милан, 2019"],
    languages: ["Казахский", "Русский", "Английский"],
    rating: 4.9,
    reviewsCount: 214,
    reviews: [
      r(
        "Дана К.",
        "2 нояб",
        5,
        "Пришла с острой болью, через час ушла без боли. Всё объяснила и показала снимок.",
      ),
      r("Ерлан М.", "28 окт", 5, "Перелечила канал после другой клиники. Аккуратно и без спешки."),
      r("Ольга П.", "19 окт", 4, "Хороший врач, но пришлось подождать минут 10."),
    ],
    priceFactor: 1.2,
    load: 0.72,
    daysOff: [0],
  },
  {
    id: "doc-kasymov",
    clinicId: "v2",
    name: "Тимур Касымов",
    direction: "dental-surgery",
    focus: "Имплантация, костная пластика",
    photo: img("photo-1622253692010-333f2da6031d", 800),
    experienceYears: 15,
    category: "Высшая категория",
    about:
      "Хирург-имплантолог, поставил больше 3 000 имплантов. Работает по цифровым шаблонам: имплант встаёт точно по плану КТ.",
    education: ["КазНМУ, 2010", "Резидентура по хирургической стоматологии, Сеул"],
    languages: ["Казахский", "Русский"],
    rating: 4.8,
    reviewsCount: 167,
    reviews: [
      r(
        "Асхат Б.",
        "1 нояб",
        5,
        "Удалил зуб мудрости за 15 минут, на следующий день уже был на работе.",
      ),
      r("Марина Л.", "22 окт", 5, "Поставил два импланта, всё заранее посчитал до тенге."),
      r("Ринат С.", "9 окт", 4, "Профессионал, но очень немногословный."),
    ],
    priceFactor: 1.3,
    load: 0.6,
    daysOff: [0, 6],
  },
  {
    id: "doc-akhmetov",
    clinicId: "v2",
    name: "Данияр Ахметов",
    direction: "orthodontics",
    focus: "Брекеты и элайнеры",
    photo: img("photo-1622902046580-2b47f47f5471", 800),
    experienceYears: 9,
    category: "Первая категория",
    about:
      "Ортодонт для взрослых и подростков. Показывает 3D-симуляцию будущей улыбки ещё до начала лечения.",
    education: ["КазНМУ, 2016", "Сертификат Invisalign Provider"],
    languages: ["Казахский", "Русский", "Английский"],
    rating: 4.9,
    reviewsCount: 98,
    reviews: [
      r("Алия Т.", "30 окт", 5, "Элайнеры за 11 месяцев, результат как на 3D-модели."),
      r("Сергей В.", "14 окт", 5, "Подробно сравнил брекеты и элайнеры, не навязывал дорогое."),
    ],
    priceFactor: 1.1,
    load: 0.5,
    daysOff: [0],
  },
  /* Dent Studio */
  {
    id: "doc-serikova",
    clinicId: "mp8",
    name: "Мадина Серикова",
    direction: "dental-hygiene",
    focus: "Профгигиена, пародонтология",
    photo: img("photo-1651008376811-b90baee60c1f", 800),
    experienceYears: 7,
    category: "Первая категория",
    about:
      "Делает гигиену бережно, без боли, и учит правильно чистить зубы. Подбирает щётку и пасту под ваши дёсны.",
    education: ["Медицинский университет Астана, 2018"],
    languages: ["Казахский", "Русский"],
    rating: 5.0,
    reviewsCount: 143,
    reviews: [
      r("Жанна А.", "4 нояб", 5, "Первая чистка, после которой не болели дёсны. Спасибо!"),
      r("Игорь Н.", "26 окт", 5, "Быстро, аккуратно, зубы на два тона светлее."),
    ],
    priceFactor: 1,
    load: 0.78,
    daysOff: [0],
  },
  {
    id: "doc-beketov",
    clinicId: "mp8",
    name: "Арман Бекетов",
    direction: "dental-therapy",
    focus: "Лечение кариеса, реставрации",
    photo: img("photo-1645066928295-2506defde470", 800),
    experienceYears: 6,
    category: "Первая категория",
    about:
      "Делает пломбы, которые не отличить от собственного зуба. Спокойно работает с теми, кто боится стоматологов, предлагает седацию.",
    education: ["Медицинский университет Астана, 2019", "Курс эстетической реставрации, Москва"],
    languages: ["Казахский", "Русский"],
    rating: 4.7,
    reviewsCount: 76,
    reviews: [
      r(
        "Камила Е.",
        "3 нояб",
        5,
        "Боялась до слёз, врач всё объяснял и делал паузы. Не было больно.",
      ),
      r("Павел Р.", "17 окт", 4, "Хорошая пломба, но долго ждал администратора."),
    ],
    priceFactor: 0.95,
    load: 0.45,
    daysOff: [0],
  },
  {
    id: "doc-li",
    clinicId: "mp8",
    name: "Сергей Ли",
    direction: "dental-surgery",
    focus: "Удаление зубов мудрости",
    photo: img("photo-1537368910025-700350fe46c7", 800),
    experienceYears: 11,
    category: "Высшая категория",
    about:
      "Удаляет сложные и ретинированные зубы мудрости ультразвуком, с минимальным отёком после операции.",
    education: ["КазНМУ, 2014", "Стажировка по пьезохирургии, Берлин"],
    languages: ["Русский", "Английский", "Корейский"],
    rating: 4.8,
    reviewsCount: 121,
    reviews: [
      r("Алмас Ж.", "31 окт", 5, "Удалил восьмёрку, лежавшую горизонтально. Почти без отёка."),
      r("Наталья К.", "12 окт", 5, "После операции сам позвонил и спросил, как я себя чувствую."),
    ],
    priceFactor: 1.15,
    load: 0.55,
    daysOff: [0, 3],
  },
  /* NurLife Clinic */
  {
    id: "doc-voronina",
    clinicId: "v5",
    name: "Елена Воронина",
    direction: "therapy",
    focus: "Терапевт, семейный врач",
    photo: img("photo-1559839734-2b71ea197ec2", 800),
    experienceYears: 18,
    category: "Высшая категория",
    about:
      "Семейный врач. Ведёт пациентов годами, помнит историю каждого и не назначает лишних анализов.",
    education: ["КазНМУ, 2007", "Резидентура по терапии, 2009"],
    languages: ["Русский", "Казахский"],
    rating: 4.9,
    reviewsCount: 302,
    reviews: [
      r(
        "Гульнара С.",
        "5 нояб",
        5,
        "Внимательная, выслушала всё до конца. Лечение помогло за три дня.",
      ),
      r("Андрей Т.", "29 окт", 5, "Наш семейный врач уже пять лет. Рекомендую."),
      r("Айдана Р.", "20 окт", 4, "Хороший специалист, но запись только на завтра."),
    ],
    priceFactor: 1.1,
    load: 0.7,
    daysOff: [0],
  },
  {
    id: "doc-mukashev",
    clinicId: "v5",
    name: "Ержан Мукашев",
    direction: "neurology",
    focus: "Боли в спине, мигрень",
    photo: img("photo-1612349317150-e413f6a5b16d", 800),
    experienceYears: 10,
    category: "Первая категория",
    about:
      "Невролог: лечит боли в спине и шее и головные боли. Начинает с упражнений и физиотерапии, к уколам прибегает только при необходимости.",
    education: ["Медицинский университет Караганды, 2015", "Курс кинезиотерапии, Стамбул"],
    languages: ["Казахский", "Русский", "Английский"],
    rating: 4.8,
    reviewsCount: 134,
    reviews: [
      r("Тимур А.", "2 нояб", 5, "Прошла спина после двух приёмов и комплекса упражнений."),
      r("Елена Г.", "24 окт", 5, "Не стал сразу отправлять на МРТ, сначала разобрался."),
    ],
    priceFactor: 1,
    load: 0.58,
    daysOff: [0, 6],
  },
  {
    id: "doc-zhumabaeva",
    clinicId: "v5",
    name: "Асель Жумабаева",
    direction: "pediatrics",
    focus: "Педиатр, дети с рождения",
    photo: img("photo-1643297654416-05795d62e39c", 800),
    experienceYears: 8,
    category: "Первая категория",
    about:
      "Педиатр, к которому дети идут без слёз. Ведёт малышей с первого месяца и всегда на связи в чате клиники.",
    education: ["КазНМУ, 2017", "Резидентура по педиатрии, 2019"],
    languages: ["Казахский", "Русский", "Английский"],
    rating: 5.0,
    reviewsCount: 189,
    reviews: [
      r("Мадина О.", "6 нояб", 5, "Сын сам просится к «тёте доктору». Лучший педиатр!"),
      r("Руслан Д.", "27 окт", 5, "Всё по делу, без лишних лекарств."),
    ],
    priceFactor: 1,
    load: 0.66,
    daysOff: [0],
  },
  /* Medilux */
  {
    id: "doc-sokolova",
    clinicId: "mp9",
    name: "Ольга Соколова",
    direction: "cardiology",
    focus: "Гипертония, аритмии",
    photo: img("photo-1631217868264-e5b90bb7e133", 800),
    experienceYears: 24,
    category: "Высшая категория, к.м.н.",
    about:
      "Кандидат медицинских наук, кардиолог с 24-летним стажем. Подбирает терапию от давления так, чтобы таблеток было как можно меньше.",
    education: ["Новосибирский ГМУ, 2001", "Кандидатская диссертация, 2010"],
    languages: ["Русский"],
    rating: 4.9,
    reviewsCount: 256,
    reviews: [
      r("Виктор М.", "3 нояб", 5, "Давление стабильное впервые за три года."),
      r("Сауле К.", "21 окт", 5, "Очень грамотная, разбирает каждую ЭКГ вместе с пациентом."),
    ],
    priceFactor: 1.25,
    load: 0.82,
    daysOff: [0, 6],
  },
  {
    id: "doc-ibraev",
    clinicId: "mp9",
    name: "Канат Ибраев",
    direction: "ent",
    focus: "ЛОР, эндоскопия",
    photo: img("photo-1666887360742-974c8fce8e6b", 800),
    experienceYears: 9,
    category: "Первая категория",
    about:
      "ЛОР-врач: эндоскопический осмотр за 5 минут, запись видео на ваш телефон. Лечит синуситы без проколов.",
    education: ["КазНМУ, 2016", "Курс эндоскопической ЛОР-хирургии, Анкара"],
    languages: ["Казахский", "Русский", "Английский"],
    rating: 4.7,
    reviewsCount: 88,
    reviews: [
      r("Дария Н.", "1 нояб", 5, "Показал на экране, что происходит в носу. Очень наглядно."),
      r("Максим Ф.", "15 окт", 4, "Помог с ушами, но кабинет было трудно найти."),
    ],
    priceFactor: 1,
    load: 0.48,
    daysOff: [0],
  },
  {
    id: "doc-omarova",
    clinicId: "mp9",
    name: "Динара Омарова",
    direction: "therapy",
    focus: "Терапевт, check-up",
    photo: img("photo-1614608682850-e0d6ed316d47", 800),
    experienceYears: 11,
    category: "Высшая категория",
    about:
      "Терапевт, составляет программы check-up. За один визит собирает картину здоровья и объясняет анализы простым языком.",
    education: ["Медицинский университет Астана, 2014"],
    languages: ["Казахский", "Русский"],
    rating: 4.8,
    reviewsCount: 117,
    reviews: [
      r("Нурлан Е.", "4 нояб", 5, "Прошёл check-up за утро, всё объяснила по каждому анализу."),
      r("Инна В.", "18 окт", 5, "Доброжелательная и очень пунктуальная."),
    ],
    priceFactor: 1,
    load: 0.52,
    daysOff: [0],
  },
  {
    id: "doc-kim",
    clinicId: "mp9",
    name: "Нурсултан Ким",
    direction: "neurology",
    focus: "Невролог, нейровизуализация",
    photo: img("photo-1581595219315-a187dd40c322", 800),
    experienceYears: 14,
    category: "Высшая категория",
    about:
      "Невролог, сам читает снимки МРТ. Если есть свежий снимок, расшифрует его прямо на приёме.",
    education: ["КазНМУ, 2011", "Стажировка по нейрорадиологии, Сеул"],
    languages: ["Русский", "Казахский", "Корейский"],
    rating: 4.7,
    reviewsCount: 95,
    reviews: [
      r("Аружан Б.", "30 окт", 5, "Разобрал МРТ за 10 минут, всё стало понятно."),
      r("Олег С.", "11 окт", 4, "Знающий врач, но приём прошёл быстро."),
    ],
    priceFactor: 1.15,
    load: 0.62,
    daysOff: [0, 2],
  },
];

/* ── Склонения ───────────────────────────────────────────────────── */

export function plural(n: number, [one, few, many]: [string, string, string]) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
export const doctorsText = (n: number) => `${n} ${plural(n, ["врач", "врача", "врачей"])}`;
export const slotsText = (n: number) => `${n} ${plural(n, ["окно", "окна", "окон"])}`;

/* ── Справочники ─────────────────────────────────────────────────── */

export const clinicById = (id: string) => clinics.find((c) => c.id === id);
export const doctorById = (id: string) => doctors.find((d) => d.id === id);
export const symptomById = (id: string) => symptoms.find((s) => s.id === id);
export const doctorsOf = (clinicId: string) => doctors.filter((d) => d.clinicId === clinicId);

export const clinicDirections = (clinicId: string): Direction[] => {
  const ids = [...new Set(doctorsOf(clinicId).map((d) => d.direction))];
  return ids.map((id) => directions[id]);
};

/** Симптомы, которые клиника может принять (или все — для общего поиска). */
export const symptomsFor = (clinicId?: string | null) => {
  if (!clinicId) return symptoms;
  const dirs = new Set(doctorsOf(clinicId).map((d) => d.direction));
  return symptoms.filter((s) => dirs.has(s.direction));
};

const round500 = (n: number) => Math.round(n / 500) * 500;

export type DoctorService = ClinicService & { price: number };

export const doctorServices = (d: Doctor): DoctorService[] =>
  directions[d.direction].services.map((s) => ({ ...s, price: round500(s.price * d.priceFactor) }));

export const firstService = (d: Doctor) =>
  doctorServices(d).find((s) => s.first) ?? doctorServices(d)[0];

export const clinicPriceFrom = (clinicId: string) =>
  Math.min(...doctorsOf(clinicId).flatMap((d) => doctorServices(d).map((s) => s.price)));

/* ── Шахматка: дни и слоты ──────────────────────────────────────── */

export type ClinicDay = {
  key: string; // YYYY-MM-DD
  index: number;
  date: Date;
  weekday: number;
  short: string; // «Сб»
  dayNum: number;
  label: string; // «Сегодня», «Завтра», «Пн, 9 нояб»
};

const WD = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTHS = [
  "янв",
  "февр",
  "мар",
  "апр",
  "мая",
  "июн",
  "июл",
  "авг",
  "сент",
  "окт",
  "нояб",
  "дек",
];

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function clinicDays(count = 14, from = new Date()): ClinicDay[] {
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(base);
    date.setDate(base.getDate() + i);
    const weekday = date.getDay();
    const long = `${WD[weekday]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
    return {
      key: dayKey(date),
      index: i,
      date,
      weekday,
      short: WD[weekday],
      dayNum: date.getDate(),
      label: i === 0 ? "Сегодня" : i === 1 ? "Завтра" : long,
    };
  });
}

export const dayLong = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${WD[date.getDay()]}, ${d} ${MONTHS[m - 1]}`;
};

export const relativeDay = (key: string, today = new Date()) => {
  const t = dayKey(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (key === t) return "Сегодня";
  if (key === dayKey(tomorrow)) return "Завтра";
  return dayLong(key);
};

/** Сетка приёма — каждые 30 минут. */
export const SLOT_STEP = 30;

export type SlotState = "free" | "taken" | "closed" | "past";

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export const toTime = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

/** Все строки шахматки для набора клиник: от самого раннего открытия до позднего закрытия. */
export function gridTimes(clinicIds: string[], weekday: number): number[] {
  let open = 24 * 60;
  let close = 0;
  for (const id of clinicIds) {
    const c = clinicById(id);
    if (!c) continue;
    const h = weekday === 0 ? c.hours.sunday : ([c.hours.open, c.hours.close] as [number, number]);
    if (!h) continue;
    open = Math.min(open, h[0] * 60);
    close = Math.max(close, h[1] * 60);
  }
  if (close <= open) return [];
  const out: number[] = [];
  for (let t = open; t < close; t += SLOT_STEP) out.push(t);
  return out;
}

/** Состояние ячейки шахматки: детерминированно от врача, дня и времени. */
export function slotState(d: Doctor, day: ClinicDay, minute: number, now = new Date()): SlotState {
  const c = clinicById(d.clinicId);
  if (!c) return "closed";
  if (d.daysOff.includes(day.weekday)) return "closed";
  const h =
    day.weekday === 0 ? c.hours.sunday : ([c.hours.open, c.hours.close] as [number, number]);
  if (!h || minute < h[0] * 60 || minute >= h[1] * 60) return "closed";
  // Обед врача — 13:00–14:00.
  if (minute >= 13 * 60 && minute < 14 * 60) return "closed";
  if (day.index === 0) {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (minute <= nowMin + 30) return "past";
  }
  // Завтра и сегодня заняты плотнее, через неделю — свободнее.
  const crowd = d.load * (day.index <= 1 ? 1.08 : day.index <= 4 ? 1 : 0.82);
  return hash(`${d.id}|${day.key}|${minute}`) < crowd ? "taken" : "free";
}

export type FreeSlot = { doctorId: string; dayKey: string; minute: number };

/** Ближайшие свободные окна врача — для карточек и быстрых чипов. */
export function nearestSlots(d: Doctor, count = 6, now = new Date()): FreeSlot[] {
  const out: FreeSlot[] = [];
  for (const day of clinicDays(14, now)) {
    for (const m of gridTimes([d.clinicId], day.weekday)) {
      if (slotState(d, day, m, now) === "free") {
        out.push({ doctorId: d.id, dayKey: day.key, minute: m });
        if (out.length >= count) return out;
      }
    }
  }
  return out;
}

export function freeCount(ds: Doctor[], day: ClinicDay, now = new Date()) {
  let n = 0;
  for (const d of ds) {
    for (const m of gridTimes([d.clinicId], day.weekday)) {
      if (slotState(d, day, m, now) === "free") n++;
    }
  }
  return n;
}
