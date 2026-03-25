// ─── nutrition.js ─────────────────────────────────────────────────
// Pure calculation functions: MET lookup, BMR/TDEE, daily targets,
// date helpers, and log aggregation.
// No React, no DOM, no side-effects — every function is deterministic.
// Depends on: data.js (MET_T, INT_EN, DAYS must be in scope)

"use strict";

// ─── MET lookup ───────────────────────────────────────────────────
/**
 * Return the MET value for a given workout type and intensity label.
 * Falls back to "Other" if the workout type is unrecognised.
 *
 * @param {string} workoutType  - e.g. "Running"
 * @param {string} intensity    - one of INT_EN ("Light" | "Moderate" | "Intense")
 * @returns {number}
 */
function getMET(workoutType, intensity) {
  const row = MET_T[workoutType] || MET_T["Other"];
  const idx = Math.max(0, INT_EN.indexOf(intensity));
  return row[idx];
}

// ─── Date helpers ─────────────────────────────────────────────────
/**
 * Format a Date object as "YYYY-MM-DD" in local time.
 * Used as the key for every daily log entry.
 *
 * @param {Date} d
 * @returns {string}
 */
function dk(d) {
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${dy}`;
}

/**
 * Return the DAYS[] index (0 = mon … 6 = sun) for today.
 * JS getDay() returns 0=Sun, so we remap to Mon-first.
 *
 * @returns {number}
 */
function todayDowIndex() {
  const raw = new Date().getDay(); // 0=Sun
  return raw === 0 ? 6 : raw - 1;
}

/**
 * Return the DAYS key string for today (e.g. "wed").
 *
 * @returns {string}
 */
function todayDayKey() {
  return DAYS[todayDowIndex()];
}

// ─── Log helpers ──────────────────────────────────────────────────
/**
 * Return an empty daily log object.
 * Used when no entry exists yet for a given date.
 *
 * @returns {{ meals: { breakfast: [], lunch: [], dinner: [], snacks: [] }, water: number }}
 */
function ed() {
  return {
    meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
    water: 0,
  };
}

/**
 * Sum all macro values across every meal in a daily log.
 *
 * @param {{ meals: Object }} dayLog
 * @returns {{ cal: number, prot: number, carb: number, fat: number }}
 */
function gm(dayLog) {
  let cal = 0, prot = 0, carb = 0, fat = 0;

  Object.values(dayLog.meals).forEach(items =>
    items.forEach(item => {
      cal  += item.cal  || 0;
      prot += item.prot || 0;
      carb += item.carb || 0;
      fat  += item.fat  || 0;
    })
  );

  return {
    cal:  Math.round(cal),
    prot: Math.round(prot),
    carb: Math.round(carb),
    fat:  Math.round(fat),
  };
}

// ─── Base targets (weekly average) ───────────────────────────────
/**
 * Calculate BMR, TDEE, and baseline daily macro targets from the
 * user profile and weekly schedule.
 *
 * Algorithm:
 *   - Mifflin-St Jeor BMR
 *   - Workout calorie contribution via MET, averaged across 7 days
 *   - Active-day multiplier summed over the week
 *   - Calorie target adjusted toward a goal-weight deadline when set,
 *     otherwise by goal multiplier (cut/bulk/recomp/maintain)
 *   - Protein scaled by goal intensity
 *   - Carbs = 40 % of calories, fat = 25 % of calories (baseline)
 *   - Water = 35 ml per kg of body weight
 *
 * @param {Object} pr  - profile fields: sex, age, weight, height, goal,
 *                       targetWeight, targetDate
 * @param {Object} sc  - weekly schedule keyed by DAYS[]
 * @returns {Object|null} - null when required profile fields are missing
 */
function calcBase(pr, sc) {
  const { sex, age, weight, height, goal, targetWeight, targetDate } = pr;
  if (!age || !weight || !height) return null;

  const w = parseFloat(weight);
  const h = parseFloat(height);
  const a = parseInt(age);

  // Mifflin-St Jeor
  const bmr = sex === "male"
    ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
    : 447.593 + 9.247 * w + 3.098 * h - 4.330 * a;

  // Weekly workout calorie surplus (net above resting), spread over 7 days
  const workoutBonus = Object.values(sc)
    .filter(d => d.type === "workout")
    .reduce((sum, d) => {
      const durationHr = (parseInt(d.dur) || 60) / 60;
      const met        = getMET(d.wtype || "Gym / weights", d.inten || "Moderate");
      const gross      = met * w * durationHr;
      const resting    = bmr * (durationHr / 24);
      return sum + (gross - resting) / 7;
    }, 0);

  // Active-day multiplier (fractional add to sedentary 1.2 base)
  const activeBonus = Object.values(sc)
    .filter(d => d.type === "active")
    .reduce((sum, d) => {
      const b = d.inten === "Intense" ? 0.06 : d.inten === "Moderate" ? 0.04 : 0.015;
      return sum + b;
    }, 0);

  const tdee = Math.round(bmr * (1.2 + activeBonus) + workoutBonus);

  // Protein multiplier by goal
  const protMultiplier = (goal === "cut" || goal === "bulk") ? 1.8
    : goal === "recomp" ? 1.6
    : 1.3;
  const prot = Math.round(w * protMultiplier);

  // Deadline-based calorie adjustment
  const tw = targetWeight ? parseFloat(targetWeight) : null;
  const td = targetDate   ? new Date(targetDate)     : null;
  const dl = td ? Math.max(1, Math.round((td - new Date()) / 86400000)) : null;

  let cal = tdee;

  if (tw && dl && goal !== "maintain") {
    // kg to lose/gain × 7700 kcal/kg ÷ days = daily delta
    const delta = Math.round(((w - tw) * 7700) / dl);
    // Clamp: max 500 kcal surplus, max 1000 kcal deficit
    cal = Math.round(tdee - Math.max(-1000, Math.min(500, delta)));
  } else if (goal === "cut")     { cal = Math.round(tdee * 0.85); }
    else if (goal === "bulk")    { cal = Math.round(tdee * 1.10); }
    else if (goal === "recomp")  { cal = Math.round(tdee * 0.97); }

  return {
    bmr:   Math.round(bmr),
    tdee,
    cal,
    prot,
    carbs: Math.round((cal * 0.40) / 4),   // 40 % of cals from carbs
    fat:   Math.round((cal * 0.25) / 9),   // 25 % of cals from fat
    water: Math.round(w * 35),             // 35 ml / kg
    dl,   // days to deadline (null if none)
    tw,   // target weight (null if none)
    w,    // body weight (carried for per-day burn calc)
  };
}

// ─── Per-day targets ─────────────────────────────────────────────
/**
 * Adjust the baseline targets for a specific day's schedule type
 * and intensity.
 *
 * Workout days: add 60 % of estimated calorie burn to calories,
 *   scale carbs up proportionally, bump protein 5 %.
 * Active days:  scale calories and carbs by a small intensity bonus.
 * Rest days:    reduce calories to 90 % and carbs to 75 %.
 * Event days:   unchanged calories, water nudged up slightly.
 *
 * Water targets are set independently of macros based on day type
 * and intensity.
 *
 * @param {Object|null} base  - result of calcBase()
 * @param {Object}      ds    - one day's schedule entry
 * @returns {Object|null}
 */
function calcDay(base, ds) {
  if (!base) return null;

  const { type, inten, dur, wtype } = ds;

  let cal  = base.cal;
  let prot = base.prot;
  let carb = base.carbs;
  let fat  = base.fat;

  // Water target by day type × intensity
  let water = 2200;
  if (type === "workout") {
    water = inten === "Intense" ? 3200 : inten === "Moderate" ? 2800 : 2500;
  } else if (type === "active") {
    water = inten === "Intense" ? 2800 : inten === "Moderate" ? 2500 : 2200;
  } else if (type === "event") {
    water = 2500;
  }

  if (type === "workout") {
    const durationHr = (parseInt(dur) || 60) / 60;
    const burn       = Math.round(getMET(wtype || "Gym / weights", inten || "Moderate") * base.w * durationHr);
    cal  = base.cal + Math.round(burn * 0.6);
    carb = Math.round(base.carbs * (1 + (burn * 0.4) / base.cal));
    prot = Math.round(base.prot * 1.05);

  } else if (type === "active") {
    const bonus = inten === "Intense" ? 0.07 : inten === "Moderate" ? 0.04 : 0.015;
    cal  = Math.round(base.cal   * (1 + bonus));
    carb = Math.round(base.carbs * (1 + bonus));
    prot = Math.round(base.prot  * 1.02);

  } else if (type === "rest") {
    cal  = Math.round(base.cal   * 0.90);
    carb = Math.round(base.carbs * 0.75);
  }
  // event → unchanged

  return { cal, prot, carb, fat, water, type };
}

// ─── Food search helper ───────────────────────────────────────────
/**
 * Search DB for entries matching a query string.
 * Matches against both English name (n) and Chinese name (z).
 *
 * @param {string} query
 * @param {number} [limit=8]
 * @returns {Array}
 */
function searchFood(query, limit) {
  limit = limit || 8;
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();
  return DB
    .filter(f => f.n.toLowerCase().includes(q) || (f.z && f.z.includes(q)))
    .slice(0, limit);
}

// ─── Cooking method adjuster ─────────────────────────────────────
/**
 * Apply a cooking method's calorie/fat adjustment to a food item.
 * Only applies to items whose type is in RAW_TYPES.
 *
 * @param {Object} item       - { cal, fat, prot, carb, ... }
 * @param {string} methodKey  - one of COOKING.keys
 * @returns {Object}          - new item with adjusted cal and fat
 */
function applyCookingMethod(item, methodKey) {
  if (!item.t || !RAW_TYPES.includes(item.t)) return item;
  const adj = COOKING.adj[methodKey];
  if (!adj) return item;
  return {
    ...item,
    cal: Math.max(0, item.cal + adj.cal),
    fat: Math.max(0, item.fat + adj.fat),
  };
}
