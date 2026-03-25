// ─── data.js ──────────────────────────────────────────────────────
// All static constants: colours, food database, tips, translations.
// No logic, no React. Pure data consumed by every other module.

"use strict";

// ─── App constants ────────────────────────────────────────────────
const STORAGE_KEY = "nutrition_tracker_v8";
const PASSCODE    = "0622";

// ─── Colour palette ───────────────────────────────────────────────
const M = {
  sage:     "#8FA68E",
  dusty:    "#B5A9A0",
  clay:     "#C4A882",
  mist:     "#A8B5BD",
  blush:    "#C9A99F",
  lavender: "#A9A6BF",
  olive:    "#9DA882",
  warm:     "#BDB09A",
  bg:       "#F7F4F0",
  card:     "#FDFCFA",
  border:   "#E2DDD7",
  text:     "#4A4540",
  muted:    "#8A8480",
  light:    "#F0ECE6",
};

// Macro colours
const MCOL = {
  cal:   M.clay,
  prot:  M.lavender,
  carb:  M.sage,
  fat:   M.blush,
  water: M.mist,
};

// Day-type badge colours
const TAG = {
  workout: { bg: "#EAF0E8", text: "#5A7A58" },
  rest:    { bg: "#F0EDE8", text: "#7A6E65" },
  active:  { bg: "#E8EDF0", text: "#4E6E7A" },
  event:   { bg: "#F0EAE0", text: "#7A5E40" },
};

// ─── Workout constants ────────────────────────────────────────────
const WT_EN = ["Gym / weights", "Running", "Swimming", "Cycling", "Ball games", "Other"];
const WT_ZH = ["健身房/重訓", "跑步", "游泳", "騎車", "球類運動", "其他"];

const INT_EN = ["Light", "Moderate", "Intense"];
const INT_ZH = ["輕度", "中等", "高強度"];

// Workout intensity hints (English)
const WH_EN = {
  "Gym / weights": ["Warm-up sets, light machines",      "Working sets, moderate load",        "Heavy compounds, near failure"],
  "Running":       ["Easy conversational jog",            "Steady pace, slightly breathless",   "Intervals or tempo run"],
  "Swimming":      ["Casual laps, easy pace",             "Continuous moderate pace",           "Fast sets, competitive pace"],
  "Cycling":       ["Flat road, easy spin",               "Rolling hills, some effort",         "Climbs, sprints, high resistance"],
  "Ball games":    ["Casual rally, no pressure",          "Recreational match",                 "Competitive match, full effort"],
  "Other":         ["Low effort, relaxed",                "Moderate effort, some sweat",        "High effort, heavy breathing"],
};

// Workout intensity hints (Chinese)
const WH_ZH = {
  "Gym / weights": ["熱身組、輕器械",         "正式訓練組、中等重量",     "重複合動作、接近力竭"],
  "Running":       ["輕鬆慢跑、可邊跑邊說話", "穩定配速、稍微喘",         "間歇跑、節奏跑"],
  "Swimming":      ["輕鬆游、悠閒配速",       "持續中等配速",             "快速來回、競技配速"],
  "Cycling":       ["平路輕鬆踩",             "有坡度或持續踩",           "爬山、衝刺、高阻力"],
  "Ball games":    ["輕鬆揮拍、無壓力",       "休閒比賽",                 "正式競賽、全力以赴"],
  "Other":         ["輕鬆、放鬆",             "中等費力、會流汗",         "高度費力、呼吸急促"],
};

// Active-day intensity hints
const AH_EN = ["Casual walk, light stretching", "Brisk walk, playing with kids", "Hiking, fast-paced activity"];
const AH_ZH = ["散步、輕度伸展",               "快走、陪孩子玩耍",               "爬山健行、高節奏活動"];

// MET values per workout type × intensity
const MET_T = {
  "Gym / weights": [3.5, 5.0,  6.0],
  "Running":       [7.0, 9.0, 11.5],
  "Swimming":      [5.0, 7.0,  9.5],
  "Cycling":       [4.0, 6.5,  9.0],
  "Ball games":    [5.0, 7.0,  9.0],
  "Other":         [3.5, 5.0,  7.0],
};

// Cooking method metadata
const COOKING = {
  en:   ["Raw", "Boiled", "Steamed", "Grilled", "Pan fried", "Stir fried", "Deep fried"],
  zh:   ["生/原味", "水煮", "清蒸", "烤", "煎", "炒", "炸"],
  keys: ["raw", "boil", "steam", "grill", "pan", "stir", "fry"],
  adj:  {
    raw:   { cal:   0, fat:  0 },
    boil:  { cal:   0, fat:  0 },
    steam: { cal:   0, fat:  0 },
    grill: { cal:  -8, fat: -1 },
    pan:   { cal:  35, fat:  4 },
    stir:  { cal:  25, fat:  3 },
    fry:   { cal:  80, fat:  9 },
  },
};

// Types that support a cooking-method selector
const RAW_TYPES = ["meat", "seafood", "egg", "veg", "tofu"];

// ─── Food database ────────────────────────────────────────────────
// Keys: n=name(EN), z=name(ZH), cal, p=protein, c=carbs, f=fat, u=unit, t=type(opt)
const DB = [
  // Grains & rice
  { n: "Steamed white rice",    z: "白飯",     cal: 130, p: 2.7, c: 28, f: 0.3, u: "100g" },
  { n: "Steamed brown rice",    z: "糙米飯",   cal: 112, p: 2.6, c: 24, f: 0.9, u: "100g" },
  { n: "Fried rice",            z: "炒飯",     cal: 180, p: 4,   c: 30, f: 5,   u: "100g" },
  { n: "Egg fried rice",        z: "蛋炒飯",   cal: 210, p: 6,   c: 32, f: 7,   u: "100g" },
  { n: "Congee plain",          z: "白粥",     cal:  50, p: 1,   c: 11, f: 0.2, u: "100g" },
  { n: "Rice vermicelli",       z: "米粉",     cal: 109, p: 2,   c: 25, f: 0.2, u: "100g" },
  { n: "Instant noodles",       z: "泡麵",     cal: 140, p: 4,   c: 21, f: 5,   u: "100g" },

  // Japanese
  { n: "Gyudon beef rice bowl", z: "牛丼",       cal: 580, p: 25, c: 72, f: 18, u: "bowl" },
  { n: "Oyakodon",              z: "親子丼",     cal: 560, p: 28, c: 70, f: 16, u: "bowl" },
  { n: "Katsudon",              z: "カツ丼",     cal: 680, p: 28, c: 78, f: 26, u: "bowl" },
  { n: "Ramen",                 z: "拉麵",       cal: 450, p: 18, c: 60, f: 15, u: "bowl" },
  { n: "Tonkotsu ramen",        z: "豚骨拉麵",   cal: 550, p: 22, c: 62, f: 22, u: "bowl" },
  { n: "Udon",                  z: "烏龍麵",     cal: 100, p: 3,  c: 21, f: 0.5, u: "100g" },
  { n: "Yakisoba",              z: "炒麵",       cal: 420, p: 14, c: 58, f: 14, u: "plate" },
  { n: "Soba noodles",          z: "蕎麥麵",     cal:  99, p: 5,  c: 21, f: 0.1, u: "100g" },
  { n: "Miso soup",             z: "味噌湯",     cal:  40, p: 3,  c: 5,  f: 1.5, u: "bowl" },
  { n: "Gyoza",                 z: "煎餃",       cal: 240, p: 10, c: 28, f: 9,   u: "5 pcs" },
  { n: "Tonkatsu",              z: "豬排",       cal: 380, p: 22, c: 22, f: 22,  u: "piece" },
  { n: "Karaage chicken",       z: "日式炸雞",   cal: 290, p: 20, c: 14, f: 17,  u: "100g" },
  { n: "Yakitori",              z: "雞肉串燒",   cal: 160, p: 14, c: 4,  f: 9,   u: "2 skewers" },
  { n: "Edamame",               z: "毛豆",       cal: 122, p: 11, c: 10, f: 5,   u: "100g" },
  { n: "Takoyaki",              z: "章魚燒",     cal: 300, p: 10, c: 36, f: 13,  u: "6 pcs" },
  { n: "Onigiri",               z: "飯糰",       cal: 180, p: 4,  c: 36, f: 2,   u: "piece" },
  { n: "Salmon sushi",          z: "鮭魚壽司",   cal: 130, p: 8,  c: 18, f: 3,   u: "2 pcs" },

  // Korean
  { n: "Bibimbap",              z: "韓式拌飯",   cal: 490, p: 20, c: 72, f: 12, u: "bowl" },
  { n: "Kimchi jjigae",         z: "泡菜鍋",     cal: 280, p: 18, c: 20, f: 14, u: "bowl" },
  { n: "Bulgogi",               z: "韓式烤牛肉", cal: 320, p: 24, c: 14, f: 18, u: "portion" },
  { n: "Tteokbokki",            z: "辣炒年糕",   cal: 320, p: 8,  c: 60, f: 6,  u: "portion" },
  { n: "Korean fried chicken",  z: "韓式炸雞",   cal: 320, p: 20, c: 18, f: 18, u: "100g" },
  { n: "Kimchi",                z: "泡菜",       cal:  15, p: 1.1,c: 2.4,f: 0.5, u: "100g" },

  // Chinese
  { n: "Dan dan noodles",       z: "擔擔麵",     cal: 480, p: 18, c: 55, f: 20, u: "bowl" },
  { n: "Wonton noodle soup",    z: "雲吞麵",     cal: 380, p: 20, c: 45, f: 10, u: "bowl" },
  { n: "Xiao long bao",         z: "小籠包",     cal: 200, p: 9,  c: 22, f: 8,  u: "4 pcs" },
  { n: "Char siu bao",          z: "叉燒包",     cal: 160, p: 7,  c: 24, f: 4,  u: "piece" },
  { n: "Siu mai",               z: "燒賣",       cal: 150, p: 8,  c: 14, f: 7,  u: "3 pcs" },
  { n: "Spring roll",           z: "春捲",       cal: 140, p: 4,  c: 16, f: 7,  u: "piece" },
  { n: "Dumplings jiaozi",      z: "水餃",       cal: 280, p: 12, c: 36, f: 9,  u: "5 pcs" },

  // Taiwanese
  { n: "Lu rou fan",            z: "滷肉飯",     cal: 480, p: 18, c: 58, f: 18, u: "bowl" },
  { n: "Beef noodle soup",      z: "牛肉麵",     cal: 520, p: 30, c: 55, f: 18, u: "bowl" },
  { n: "Oyster vermicelli",     z: "蚵仔麵線",   cal: 350, p: 12, c: 55, f: 8,  u: "bowl" },
  { n: "Dan bing",              z: "蛋餅",       cal: 280, p: 9,  c: 36, f: 11, u: "piece" },
  { n: "Scallion pancake",      z: "蔥油餅",     cal: 280, p: 6,  c: 38, f: 12, u: "piece" },
  { n: "Three cup chicken",     z: "三杯雞",     cal: 380, p: 28, c: 8,  f: 26, u: "portion" },
  { n: "Salt pepper chicken",   z: "鹽酥雞",     cal: 350, p: 24, c: 18, f: 20, u: "portion" },
  { n: "Braised egg",           z: "滷蛋",       cal:  80, p: 6,  c: 2,  f: 5,  u: "piece" },
  { n: "Oyster omelette",       z: "蚵仔煎",     cal: 320, p: 12, c: 30, f: 16, u: "portion" },
  { n: "Pork chop rice",        z: "排骨飯",     cal: 620, p: 28, c: 68, f: 24, u: "plate" },
  { n: "Chicken leg rice",      z: "雞腿飯",     cal: 580, p: 30, c: 62, f: 22, u: "plate" },

  // Southeast Asian
  { n: "Pad thai",              z: "泰式炒河粉", cal: 400, p: 15, c: 50, f: 14, u: "plate" },
  { n: "Pho",                   z: "越南河粉",   cal: 350, p: 25, c: 40, f: 8,  u: "bowl" },
  { n: "Hainanese chicken rice",z: "海南雞飯",   cal: 480, p: 28, c: 58, f: 14, u: "plate" },
  { n: "Nasi lemak",            z: "椰漿飯",     cal: 500, p: 15, c: 60, f: 22, u: "plate" },
  { n: "Laksa",                 z: "叻沙",       cal: 520, p: 22, c: 58, f: 22, u: "bowl" },

  // Western fast food
  { n: "Big Mac",               z: "大麥克",     cal: 550, p: 25, c: 46, f: 30, u: "burger" },
  { n: "French fries",          z: "薯條",       cal: 320, p: 4,  c: 43, f: 15, u: "medium" },
  { n: "KFC fried chicken",     z: "肯德基炸雞", cal: 320, p: 22, c: 11, f: 20, u: "piece" },
  { n: "Pizza slice",           z: "披薩",       cal: 285, p: 12, c: 36, f: 10, u: "slice" },
  { n: "White bread",           z: "白吐司",     cal:  80, p: 2.5,c: 15, f: 1,  u: "slice" },
  { n: "Whole wheat bread",     z: "全麥吐司",   cal:  70, p: 3,  c: 13, f: 1,  u: "slice" },
  { n: "Croissant",             z: "可頌",       cal: 230, p: 5,  c: 26, f: 12, u: "piece" },
  { n: "Mantou",                z: "饅頭",       cal: 140, p: 4,  c: 28, f: 1,  u: "piece" },

  // Beef (raw type — supports cooking method)
  { n: "Beef brisket",          z: "牛五花/牛腩",cal: 280, p: 17, c: 0, f: 24, u: "100g", t: "meat" },
  { n: "Beef chuck",            z: "牛肩肉",    cal: 190, p: 21, c: 0, f: 12, u: "100g", t: "meat" },
  { n: "Beef shank",            z: "牛腱",      cal: 160, p: 22, c: 0, f: 8,  u: "100g", t: "meat" },
  { n: "Beef ribeye",           z: "牛肋眼",    cal: 290, p: 19, c: 0, f: 24, u: "100g", t: "meat" },
  { n: "Beef sirloin",          z: "牛沙朗",    cal: 210, p: 22, c: 0, f: 13, u: "100g", t: "meat" },
  { n: "Beef tenderloin",       z: "牛菲力",    cal: 180, p: 23, c: 0, f: 10, u: "100g", t: "meat" },
  { n: "Beef short rib",        z: "牛小排",    cal: 310, p: 18, c: 0, f: 26, u: "100g", t: "meat" },
  { n: "Beef tongue",           z: "牛舌",      cal: 270, p: 18, c: 0, f: 22, u: "100g", t: "meat" },
  { n: "Ground beef",           z: "牛絞肉",    cal: 215, p: 24, c: 0, f: 13, u: "100g", t: "meat" },
  { n: "Beef steak",            z: "牛排",      cal: 250, p: 26, c: 0, f: 16, u: "100g", t: "meat" },

  // Pork
  { n: "Pork belly",            z: "豬五花",    cal: 395, p: 14, c: 0, f: 37, u: "100g", t: "meat" },
  { n: "Pork shoulder",         z: "豬梅花肉",  cal: 220, p: 18, c: 0, f: 16, u: "100g", t: "meat" },
  { n: "Pork neck",             z: "豬頸肉",    cal: 240, p: 17, c: 0, f: 19, u: "100g", t: "meat" },
  { n: "Pork tenderloin",       z: "豬里肌",    cal: 165, p: 29, c: 0, f: 4,  u: "100g", t: "meat" },
  { n: "Pork loin chop",        z: "豬大排",    cal: 200, p: 22, c: 0, f: 12, u: "100g", t: "meat" },
  { n: "Pork ribs",             z: "豬排骨",    cal: 230, p: 18, c: 0, f: 17, u: "100g", t: "meat" },
  { n: "Ground pork",           z: "豬絞肉",    cal: 240, p: 17, c: 0, f: 19, u: "100g", t: "meat" },
  { n: "Pork liver",            z: "豬肝",      cal: 130, p: 20, c: 3, f: 4,  u: "100g", t: "meat" },

  // Chicken
  { n: "Chicken breast",        z: "雞胸肉",        cal: 165, p: 31, c: 0, f: 3.6, u: "100g", t: "meat" },
  { n: "Chicken thigh boneless",z: "去骨雞腿",      cal: 200, p: 24, c: 0, f: 11,  u: "100g", t: "meat" },
  { n: "Chicken thigh bone-in", z: "雞腿(帶骨)",    cal: 180, p: 22, c: 0, f: 10,  u: "100g", t: "meat" },
  { n: "Chicken wing",          z: "雞翅",          cal: 200, p: 17, c: 0, f: 14,  u: "piece", t: "meat" },
  { n: "Chicken drumstick",     z: "小雞腿",        cal: 170, p: 20, c: 0, f: 10,  u: "piece", t: "meat" },
  { n: "Ground chicken",        z: "雞絞肉",        cal: 150, p: 21, c: 0, f: 7,   u: "100g", t: "meat" },

  // Lamb & duck
  { n: "Lamb leg",              z: "羊腿肉", cal: 200, p: 22, c: 0, f: 12, u: "100g", t: "meat" },
  { n: "Lamb rack",             z: "羊排",   cal: 294, p: 25, c: 0, f: 21, u: "100g", t: "meat" },
  { n: "Duck breast",           z: "鴨胸肉", cal: 200, p: 19, c: 0, f: 13, u: "100g", t: "meat" },
  { n: "Duck leg",              z: "鴨腿",   cal: 220, p: 17, c: 0, f: 16, u: "100g", t: "meat" },

  // Seafood
  { n: "Salmon",                z: "鮭魚",   cal: 208, p: 28,  c: 0, f: 10,  u: "100g", t: "seafood" },
  { n: "Tuna fresh",            z: "鮪魚",   cal: 144, p: 23,  c: 0, f: 5,   u: "100g", t: "seafood" },
  { n: "Tuna canned",           z: "鮪魚罐頭",cal:116, p: 26,  c: 0, f: 1,   u: "100g", t: "seafood" },
  { n: "Shrimp",                z: "蝦",     cal:  99, p: 24,  c: 0, f: 0.3, u: "100g", t: "seafood" },
  { n: "Squid",                 z: "花枝魷魚",cal: 92, p: 16,  c: 3, f: 1.4, u: "100g", t: "seafood" },
  { n: "Clams",                 z: "蛤蜊",   cal: 148, p: 26,  c: 5, f: 2,   u: "100g", t: "seafood" },
  { n: "Tilapia",               z: "吳郭魚", cal: 128, p: 26,  c: 0, f: 2.7, u: "100g", t: "seafood" },
  { n: "Mackerel",              z: "鯖魚",   cal: 262, p: 24,  c: 0, f: 18,  u: "100g", t: "seafood" },
  { n: "Cod",                   z: "鱈魚",   cal:  82, p: 18,  c: 0, f: 0.7, u: "100g", t: "seafood" },
  { n: "Scallop",               z: "干貝",   cal: 111, p: 20,  c: 5, f: 0.8, u: "100g", t: "seafood" },

  // Eggs
  { n: "Whole egg",             z: "雞蛋", cal:  78, p: 6,   c: 0.6, f: 5,   u: "egg",       t: "egg" },
  { n: "Egg white",             z: "蛋白", cal:  17, p: 3.6, c: 0.2, f: 0,   u: "egg white", t: "egg" },
  { n: "Egg yolk",              z: "蛋黃", cal:  55, p: 2.7, c: 0.6, f: 4.5, u: "yolk",      t: "egg" },

  // Tofu & dairy
  { n: "Firm tofu",             z: "板豆腐",   cal:  76, p: 8,  c: 2,  f: 4,   u: "100g",  t: "tofu" },
  { n: "Silken tofu",           z: "嫩豆腐",   cal:  55, p: 5,  c: 2,  f: 3,   u: "100g",  t: "tofu" },
  { n: "Soy milk",              z: "豆漿",     cal:  90, p: 7,  c: 7,  f: 3.5, u: "250ml" },
  { n: "Whole milk",            z: "全脂牛奶", cal: 150, p: 8,  c: 12, f: 8,   u: "250ml" },
  { n: "Low fat milk",          z: "低脂牛奶", cal: 100, p: 8,  c: 12, f: 2.5, u: "250ml" },
  { n: "Greek yogurt",          z: "希臘優格", cal: 130, p: 17, c: 7,  f: 3.5, u: "150g" },
  { n: "Cheese",                z: "乳酪",     cal: 120, p: 7,  c: 0.4,f: 10,  u: "30g" },

  // Vegetables
  { n: "Broccoli",              z: "花椰菜",   cal:  34, p: 2.8, c: 7,   f: 0.4, u: "100g",  t: "veg" },
  { n: "Spinach",               z: "菠菜",     cal:  23, p: 2.9, c: 3.6, f: 0.4, u: "100g",  t: "veg" },
  { n: "Bok choy",              z: "青江菜",   cal:  13, p: 1.5, c: 2.2, f: 0.2, u: "100g",  t: "veg" },
  { n: "Cabbage",               z: "高麗菜",   cal:  25, p: 1.3, c: 6,   f: 0.1, u: "100g",  t: "veg" },
  { n: "Carrot",                z: "紅蘿蔔",   cal:  41, p: 0.9, c: 10,  f: 0.2, u: "100g",  t: "veg" },
  { n: "Cucumber",              z: "小黃瓜",   cal:  16, p: 0.7, c: 3.6, f: 0.1, u: "100g",  t: "veg" },
  { n: "Tomato",                z: "番茄",     cal:  22, p: 1,   c: 4.8, f: 0.2, u: "medium",t: "veg" },
  { n: "Corn",                  z: "玉米",     cal: 110, p: 3.5, c: 25,  f: 1.5, u: "cob",   t: "veg" },
  { n: "Sweet potato",          z: "地瓜",     cal:  86, p: 1.6, c: 20,  f: 0.1, u: "100g",  t: "veg" },
  { n: "Potato",                z: "馬鈴薯",   cal:  87, p: 1.9, c: 20,  f: 0.1, u: "100g",  t: "veg" },
  { n: "Eggplant",              z: "茄子",     cal:  25, p: 1,   c: 6,   f: 0.2, u: "100g",  t: "veg" },
  { n: "Mushroom shiitake",     z: "香菇",     cal:  22, p: 3.1, c: 3.3, f: 0.3, u: "100g",  t: "veg" },
  { n: "Mushroom enoki",        z: "金針菇",   cal:  37, p: 2.7, c: 7,   f: 0.3, u: "100g",  t: "veg" },
  { n: "Bitter melon",          z: "苦瓜",     cal:  17, p: 1,   c: 4,   f: 0.2, u: "100g",  t: "veg" },
  { n: "Daikon radish",         z: "白蘿蔔",   cal:  18, p: 0.6, c: 4.1, f: 0.1, u: "100g",  t: "veg" },
  { n: "Green beans",           z: "四季豆",   cal:  31, p: 1.8, c: 7,   f: 0.2, u: "100g",  t: "veg" },
  { n: "Asparagus",             z: "蘆筍",     cal:  20, p: 2.2, c: 3.7, f: 0.1, u: "100g",  t: "veg" },
  { n: "Bell pepper",           z: "甜椒",     cal:  31, p: 1,   c: 6,   f: 0.3, u: "medium",t: "veg" },
  { n: "Onion",                 z: "洋蔥",     cal:  40, p: 1.1, c: 9,   f: 0.1, u: "100g",  t: "veg" },
  { n: "Avocado",               z: "酪梨",     cal: 160, p: 2,   c: 9,   f: 15,  u: "100g",  t: "veg" },

  // Fruit
  { n: "Apple",         z: "蘋果", cal:  95, p: 0.5, c: 25,  f: 0.3, u: "medium" },
  { n: "Banana",        z: "香蕉", cal: 105, p: 1.3, c: 27,  f: 0.4, u: "medium" },
  { n: "Orange",        z: "柳丁", cal:  62, p: 1.2, c: 15,  f: 0.2, u: "medium" },
  { n: "Watermelon",    z: "西瓜", cal:  30, p: 0.6, c: 7.6, f: 0.2, u: "100g" },
  { n: "Mango",         z: "芒果", cal: 135, p: 1,   c: 35,  f: 0.6, u: "medium" },
  { n: "Guava",         z: "芭樂", cal:  68, p: 2.6, c: 14,  f: 1,   u: "medium" },
  { n: "Lychee",        z: "荔枝", cal:  66, p: 0.8, c: 17,  f: 0.4, u: "100g" },
  { n: "Dragon fruit",  z: "火龍果",cal: 60, p: 1.2, c: 13,  f: 0,   u: "100g" },
  { n: "Strawberry",    z: "草莓", cal:  32, p: 0.7, c: 7.7, f: 0.3, u: "100g" },

  // Snacks
  { n: "Potato chips",  z: "洋芋片", cal: 160, p: 2, c: 15, f: 10,  u: "30g" },
  { n: "Popcorn",       z: "爆米花", cal: 110, p: 3, c: 22, f: 1.5, u: "30g" },
  { n: "Peanuts",       z: "花生",   cal: 180, p: 8, c: 5,  f: 14,  u: "30g" },
  { n: "Almonds",       z: "杏仁",   cal: 170, p: 6, c: 6,  f: 15,  u: "30g" },
  { n: "Chocolate bar", z: "巧克力", cal: 235, p: 3, c: 26, f: 13,  u: "40g" },
  { n: "Ice cream",     z: "冰淇淋", cal: 200, p: 3, c: 24, f: 10,  u: "scoop" },
  { n: "Mochi",         z: "麻糬",   cal: 230, p: 3, c: 50, f: 2,   u: "piece" },

  // Drinks
  { n: "Bubble tea",       z: "珍珠奶茶",     cal: 350, p: 2,   c: 70, f: 5,   u: "500ml" },
  { n: "Bubble tea large", z: "珍珠奶茶大杯", cal: 450, p: 3,   c: 90, f: 6,   u: "700ml" },
  { n: "Black coffee",     z: "黑咖啡",       cal:   5, p: 0.3, c: 0,  f: 0,   u: "240ml" },
  { n: "Latte",            z: "拿鐵",         cal: 190, p: 10,  c: 19, f: 7,   u: "360ml" },
  { n: "Americano",        z: "美式咖啡",     cal:  15, p: 0.5, c: 3,  f: 0,   u: "360ml" },
  { n: "Orange juice",     z: "柳橙汁",       cal: 112, p: 1.7, c: 26, f: 0.5, u: "240ml" },
  { n: "Coca-Cola",        z: "可口可樂",     cal: 139, p: 0,   c: 35, f: 0,   u: "330ml" },
  { n: "Beer",             z: "啤酒",         cal: 150, p: 1.1, c: 13, f: 0,   u: "330ml" },
  { n: "Red wine",         z: "紅酒",         cal: 125, p: 0.1, c: 4,  f: 0,   u: "150ml" },
  { n: "Sports drink",     z: "運動飲料",     cal:  80, p: 0,   c: 21, f: 0,   u: "330ml" },
  { n: "Green tea",        z: "無糖綠茶",     cal:   2, p: 0,   c: 0.5,f: 0,   u: "330ml" },

  // Condiments & oils
  { n: "Olive oil",     z: "橄欖油", cal: 119, p: 0,   c: 0,   f: 14, u: "tbsp" },
  { n: "Butter",        z: "奶油",   cal: 102, p: 0.1, c: 0,   f: 12, u: "tbsp" },
  { n: "Peanut butter", z: "花生醬", cal: 190, p: 8,   c: 6,   f: 16, u: "2 tbsp" },
  { n: "Soy sauce",     z: "醬油",   cal:  10, p: 1,   c: 1,   f: 0,  u: "tbsp" },
  { n: "Mayonnaise",    z: "美乃滋", cal:  90, p: 0.1, c: 0.4, f: 10, u: "tbsp" },
];

// ─── Daily tips ───────────────────────────────────────────────────
const TIPS_EN = {
  workout: [
    "Fuel up with carbs 1-2 hours before your workout.",
    "Hit your protein target today — muscles need it for recovery.",
    "Eat within 30-60 min after training for best recovery.",
    "Stay hydrated — drink water before, during, and after your workout.",
  ],
  rest: [
    "Rest days are when muscles actually grow — don't stress about eating less.",
    "Keep protein high even on rest days to support muscle repair.",
    "Light stretching or a short walk is fine on rest days.",
    "Use today to prep your meals for the week ahead.",
  ],
  active: [
    "Active days still count — make sure you eat enough to fuel movement.",
    "Hydration matters even on lighter activity days.",
    "A balanced meal with carbs, protein, and fat keeps energy steady.",
    "If you are tired, eat a little more.",
  ],
  event: [
    "Enjoying a social meal is fine — just be mindful of portions.",
    "Pick what you love most at dinner — no need to skip everything.",
    "If you have a big meal tonight, eat lighter earlier in the day.",
    "Alcohol adds calories quickly — factor it in if you are drinking.",
  ],
};

const TIPS_ZH = {
  workout: [
    "訓練前 1-2 小時補充碳水化合物，提升表現。",
    "今天記得達到蛋白質目標，肌肉恢復需要它。",
    "訓練後 30-60 分鐘內進食，別跳過訓練後營養補充。",
    "多喝水，訓練前、中、後都要保持水分充足。",
  ],
  rest: [
    "休息日是肌肉真正生長的時候，不用擔心少吃一點。",
    "即使是休息日，也要維持足夠的蛋白質攝取。",
    "輕度伸展或短暫散步在休息日是沒問題的。",
    "利用今天備餐，為接下來的一週做好準備。",
  ],
  active: [
    "活動日也算消耗，確保攝取足夠熱量支撐活動。",
    "即使是輕度活動日，補水也很重要。",
    "均衡攝取碳水、蛋白質和脂肪，有助維持穩定能量。",
    "如果感到疲憊，可以多吃一點。",
  ],
  event: [
    "享受聚餐是完全OK的，注意份量就好。",
    "聚餐不必什麼都不吃，選你最想吃的來享用。",
    "如果知道晚上有大餐，白天可以吃清淡一點。",
    "酒精熱量不低，如果有喝酒，記得把它算進去。",
  ],
};

// ─── UI strings (i18n) ───────────────────────────────────────────
const T = {
  en: {
    tabs:     ["Dashboard", "Log Food", "Schedule", "Daily Tips"],
    pnav:     "Profile",
    name:     "Name",
    age:      "Age",
    wt:       "Weight (kg)",
    ht:       "Height (cm)",
    sex:      "Sex",
    male:     "Male",
    female:   "Female",
    goal:     "Goal",
    recomp:   "Body recomposition",
    cut:      "Cut",
    bulk:     "Bulk",
    maintain: "Maintain",
    twt:      "Target weight (kg)",
    tdate:    "Target date",
    dtargets: "Your daily targets",
    bmr:      "BMR",
    tdee:     "TDEE",
    cal:      "Calories",
    prot:     "Protein",
    carb:     "Carbs",
    fat:      "Fat",
    water:    "Water",
    bmrEx:    "BMR is the calories your body burns at complete rest.",
    tdeeEx:   "TDEE is your BMR adjusted for your activity level. Your food targets are based on this.",
    bfast:    "Breakfast",
    lunch:    "Lunch",
    dinner:   "Dinner",
    snacks:   "Snacks",
    wlabel:   "Water",
    wreset:   "Reset",
    tgt:      "Target",
    setupmsg: "Set up your profile to see personalized targets.",
    today:    "Today",
    yest:     "Yesterday",
    mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu",
    fri: "Fri", sat: "Sat", sun: "Sun",
    wtype:    "Workout type",
    dur:      "Duration (min)",
    inten:    "Intensity",
    notes:    "Notes",
    noteph:   "e.g. felt tired, skipped last set",
    wtypes:   WT_EN,
    intens:   INT_EN,
    dtypes:   { workout: "Workout", rest: "Rest", active: "Active", event: "Event" },
    evph:     "e.g. Family dinner",
    wtitle:   "Weight progress",
    wph:      "Log today's weight (kg)",
    wlog:     "Log",
    nodata:   "Log your weight daily to see progress.",
    dgoals:   "Today's targets",
    tsched:   "Today",
    weeklyTitle: "This week",
    consumed: "Consumed",
    over:     "Over",
    searchFood: "Search food",
    sph:      "e.g. chicken, 雞胸肉, bubble tea",
    manual:   "Enter manually",
    fname:    "Food name",
    fcal:     "Calories (kcal)",
    fsrv:     "Servings",
    fadd:     "Add",
    nores:    "Not found. Try another name or enter manually.",
    dailyTip: "Daily tip",
    calleft:  "Calories left",
    protleft: "Protein left",
    cookMethod: "Cooking method",
    aiph:     'e.g. "2 ribs from TGI Fridays" or upload a photo',
    upph:     "Upload photo",
    logbtn:   "Log food",
    analyzing:"Analyzing...",
    askph:    "Ask your coach...",
    send:     "Send",
    thinking: "Thinking...",
    cintro:   "Your AI coach knows your schedule, targets, and today's food log.",
    sugg:     ["How am I doing today?", "What should I eat for dinner?", "How much protein left?", "Big dinner tonight — how to plan?", "Weekly summary"],
    guest:    "Guest",
    pctitle:  "Welcome",
    pcsub:    "Enter your passcode or continue as a guest",
    pcph:     "Passcode",
    unlock:   "Unlock",
    asguest:  "Continue as guest",
    wrongpc:  "Incorrect passcode",
  },
  zh: {
    tabs:     ["儀表板", "記錄飲食", "行程表", "每日提示"],
    pnav:     "個人資料",
    name:     "姓名",
    age:      "年齡",
    wt:       "體重 (kg)",
    ht:       "身高 (cm)",
    sex:      "性別",
    male:     "男",
    female:   "女",
    goal:     "目標",
    recomp:   "體態重組",
    cut:      "減脂",
    bulk:     "增肌",
    maintain: "維持現狀",
    twt:      "目標體重 (kg)",
    tdate:    "目標日期",
    dtargets: "每日目標",
    bmr:      "基礎代謝率",
    tdee:     "每日總消耗",
    cal:      "熱量",
    prot:     "蛋白質",
    carb:     "碳水",
    fat:      "脂肪",
    water:    "水分",
    bmrEx:    "BMR 是身體在完全靜止時所消耗的熱量。",
    tdeeEx:   "TDEE 是根據你每週活動量調整後的每日總消耗。",
    bfast:    "早餐",
    lunch:    "午餐",
    dinner:   "晚餐",
    snacks:   "點心",
    wlabel:   "水分",
    wreset:   "重設",
    tgt:      "目標",
    setupmsg: "請先設定個人資料以查看每日目標。",
    today:    "今天",
    yest:     "昨天",
    mon: "週一", tue: "週二", wed: "週三", thu: "週四",
    fri: "週五", sat: "週六", sun: "週日",
    wtype:    "運動類型",
    dur:      "時長（分鐘）",
    inten:    "強度",
    notes:    "備注",
    noteph:   "例如：今天感覺疲憊",
    wtypes:   WT_ZH,
    intens:   INT_ZH,
    dtypes:   { workout: "運動", rest: "休息", active: "活動", event: "社交活動" },
    evph:     "例如：家庭聚餐",
    wtitle:   "體重進度",
    wph:      "記錄今日體重 (kg)",
    wlog:     "記錄",
    nodata:   "每日記錄體重以查看進度圖表。",
    dgoals:   "今日目標",
    tsched:   "今天",
    weeklyTitle: "本週概覽",
    consumed: "已攝取",
    over:     "超標",
    searchFood: "搜尋食物",
    sph:      "例如：雞胸肉、珍珠奶茶",
    manual:   "手動輸入",
    fname:    "食物名稱",
    fcal:     "熱量（大卡）",
    fsrv:     "份量",
    fadd:     "新增",
    nores:    "找不到，請換個名稱或手動輸入。",
    dailyTip: "今日小提示",
    calleft:  "剩餘熱量",
    protleft: "剩餘蛋白質",
    cookMethod: "烹飪方式",
    aiph:     "例如「TGI Fridays 的 2 根肋排、薯條」，或上傳照片",
    upph:     "上傳照片",
    logbtn:   "記錄",
    analyzing:"分析中...",
    askph:    "詢問你的教練...",
    send:     "送出",
    thinking: "思考中...",
    cintro:   "AI 教練了解你的行程、每日目標和飲食記錄，隨時發問。",
    sugg:     ["我今天表現怎麼樣？", "晚餐該吃什麼？", "我還能吃多少蛋白質？", "今晚有大餐，我該怎麼計劃？", "給我一個週度總結"],
    guest:    "訪客",
    pctitle:  "歡迎使用",
    pcsub:    "請輸入密碼，或以訪客身份繼續",
    pcph:     "輸入密碼",
    unlock:   "解鎖",
    asguest:  "以訪客身份繼續",
    wrongpc:  "密碼錯誤",
  },
};

// ─── Schedule skeleton ────────────────────────────────────────────
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const DSCHED = DAYS.reduce((a, d) => ({
  ...a,
  [d]: { type: "rest", wtype: "Gym / weights", dur: 60, inten: "Moderate", notes: "", detail: "" },
}), {});

// ─── Font-size scale ──────────────────────────────────────────────
const FSZ = {
  sm: { b: 14, m: 13, s: 12, x: 11 },
  md: { b: 16, m: 14, s: 13, x: 12 },
  lg: { b: 18, m: 16, s: 14, x: 13 },
};
