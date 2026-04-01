// ─── app.js ───────────────────────────────────────────────────────
// All feature-level React components and the root App.
// JSX converted to h() (React.createElement) throughout.
//
// Load order in index.html must be:
//   data.js → nutrition.js → ui.js → app.js
//
// Globals consumed from earlier files:
//   React, ReactDOM                        (CDN)
//   h                                      (ui.js)
//   M, MCOL, TAG, DAYS, DSCHED, FSZ        (data.js)
//   T, TIPS_EN, TIPS_ZH                    (data.js)
//   WT_EN, INT_EN, WH_EN, WH_ZH, AH_EN, AH_ZH (data.js)
//   DB, COOKING, RAW_TYPES                 (data.js)
//   STORAGE_KEY, PASSCODE                  (data.js)
//   calcBase, calcDay, dk, ed, gm          (nutrition.js)
//   todayDowIndex                          (nutrition.js)
//   Seg, Card, Divd, SLbl, Fld, Inp, Sel, MPill, DurInp (ui.js)

const { useState, useEffect, useRef } = React;

// ─── Backend proxy URL ────────────────────────────────────────────
// Point this at your Render service once deployed.
// Leave as "" to show the AI UI in disabled/greyed state.
const PROXY_URL = "";

// ─── PcScreen ─────────────────────────────────────────────────────
// Passcode gate shown before the app loads.
// Props: onUnlock, onGuest, t, F
function PcScreen({ onUnlock, onGuest, t, F }) {
  const [code, setCode] = useState("");
  const [err,  setErr]  = useState(false);

  function tryUnlock() {
    if (code === PASSCODE) {
      onUnlock();
    } else {
      setErr(true);
      setCode("");
      setTimeout(() => setErr(false), 1500);
    }
  }

  return h("div",
    {
      style: {
        minHeight: 400, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "2rem", background: M.bg, borderRadius: 16,
      },
    },
    // Icon
    h("div", {
      style: {
        width: 56, height: 56, borderRadius: "50%",
        background: M.light, border: `1px solid ${M.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26, marginBottom: 14,
      },
    }, "🥗"),

    h("div", { style: { fontSize: F.b + 4, fontWeight: 600, marginBottom: 6, color: M.text } }, t.pctitle),
    h("div", { style: { fontSize: F.s, color: M.muted, marginBottom: 28, textAlign: "center" } }, t.pcsub),

    h("div", { style: { width: "100%", maxWidth: 280, display: "flex", flexDirection: "column", gap: 10 } },
      h("input", {
        type: "password",
        inputMode: "numeric",
        maxLength: 4,
        value: code,
        onChange: e => setCode(e.target.value),
        onKeyDown: e => e.key === "Enter" && tryUnlock(),
        placeholder: t.pcph,
        style: {
          width: "100%", padding: "12px", fontSize: F.b,
          border: `1px solid ${err ? "#C4786A" : M.border}`,
          borderRadius: 10, background: M.card, color: M.text,
          boxSizing: "border-box", textAlign: "center",
          letterSpacing: 6, outline: "none",
        },
      }),
      err && h("div", { style: { fontSize: F.x, color: "#C4786A", textAlign: "center" } }, t.wrongpc),
      h("button", {
        onClick: tryUnlock,
        style: {
          padding: "11px", fontSize: F.s, fontWeight: 500,
          border: `1px solid ${M.sage}`, borderRadius: 10,
          background: M.sage, color: "#fff", cursor: "pointer",
        },
      }, t.unlock),
      h("button", {
        onClick: onGuest,
        style: {
          padding: "11px", fontSize: F.s,
          border: `1px solid ${M.border}`, borderRadius: 10,
          background: "transparent", color: M.muted, cursor: "pointer",
        },
      }, t.asguest)
    )
  );
}

// ─── WeeklyChart ──────────────────────────────────────────────────
// SVG line chart showing one macro/water metric across the current week.
// Props: logs, base, sc, t, F
function WeeklyChart({ logs, base, sc, t, F }) {
  const [view, setView] = useState("cal");

  const todayDow  = todayDowIndex();
  const weekDates = DAYS.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (todayDow - i));
    return dk(d);
  });
  const DAY_LABS = [t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun];

  const VIEWS = [
    { k: "cal",   label: t.cal,   color: M.clay     },
    { k: "prot",  label: t.prot,  color: M.lavender },
    { k: "carb",  label: t.carb,  color: M.sage     },
    { k: "fat",   label: t.fat,   color: M.blush    },
    { k: "water", label: t.water, color: M.mist     },
  ];

  const weekData = DAYS.map((day, i) => {
    const dl  = logs[weekDates[i]] || ed();
    const m   = gm(dl);
    const tgt = calcDay(base, sc[day] || { type: "rest" });
    return {
      label: DAY_LABS[i],
      cal:   { c: m.cal,                    t: tgt?.cal   || 0 },
      prot:  { c: m.prot,                   t: tgt?.prot  || 0 },
      carb:  { c: m.carb,                   t: tgt?.carb  || 0 },
      fat:   { c: m.fat,                    t: tgt?.fat   || 0 },
      water: { c: Math.round(dl.water || 0),t: tgt?.water || 2200 },
    };
  });

  const av       = VIEWS.find(v => v.k === view);
  const consumed = weekData.map(d => d[view].c);
  const targets  = weekData.map(d => d[view].t);
  const allV     = [...consumed, ...targets].filter(v => v > 0);
  const maxV     = allV.length > 0 ? Math.max(...allV) * 1.2 : 200;

  // SVG geometry
  const W = 520, H = 150, pL = 38, pR = 10, pT = 12, pB = 24;
  const cW = W - pL - pR, cH = H - pT - pB;
  const xp = i => pL + (i / 6) * cW;
  const yp = v => pT + cH - Math.min(1, v / maxV) * cH;
  const ticks = [0, Math.round(maxV * 0.5), Math.round(maxV)];

  return h("div", null,

    // Header row: section label + view buttons
    h("div", {
      style: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 10, flexWrap: "wrap", gap: 6,
      },
    },
      h(SLbl, { label: t.weeklyTitle, F, color: av.color }),
      h("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } },
        VIEWS.map(v =>
          h("button", {
            key: v.k,
            onClick: () => setView(v.k),
            style: {
              padding: "3px 10px", fontSize: F.x,
              border: `1px solid ${view === v.k ? v.color : M.border}`,
              borderRadius: 20,
              background: view === v.k ? v.color : "transparent",
              color: view === v.k ? "#fff" : M.muted,
              cursor: "pointer", fontWeight: view === v.k ? 500 : 400,
            },
          }, v.label)
        )
      )
    ),

    // Legend
    h("div", { style: { display: "flex", gap: 14, fontSize: F.x, color: M.muted, marginBottom: 8, flexWrap: "wrap" } },
      h("span", { style: { display: "flex", alignItems: "center", gap: 5 } },
        h("span", { style: { width: 18, height: 3, background: av.color, borderRadius: 2, display: "inline-block" } }),
        t.consumed
      ),
      h("span", { style: { display: "flex", alignItems: "center", gap: 5 } },
        h("span", { style: { width: 18, height: 0, borderTop: `2px dashed ${av.color}`, opacity: 0.4, display: "inline-block" } }),
        t.tgt
      ),
      h("span", { style: { display: "flex", alignItems: "center", gap: 5 } },
        h("span", { style: { width: 8, height: 8, borderRadius: "50%", background: "#C4786A", display: "inline-block" } }),
        t.over
      )
    ),

    // SVG chart
    h("svg", { viewBox: `0 0 ${W} ${H}`, style: { width: "100%", height: H, display: "block" } },
      // Grid lines + y-axis ticks
      ticks.map(tick =>
        h("g", { key: tick },
          h("line", { x1: pL, y1: yp(tick), x2: W - pR, y2: yp(tick), stroke: M.border, strokeWidth: "1", strokeDasharray: "3,3" }),
          h("text", { x: pL - 4, y: yp(tick) + 4, fontSize: "9", fill: M.muted, textAnchor: "end" }, tick)
        )
      ),
      // Target dashed line
      h("polyline", {
        points: targets.map((v, i) => `${xp(i)},${yp(v)}`).join(" "),
        fill: "none", stroke: av.color, strokeWidth: "1.5", strokeDasharray: "5,4", opacity: "0.4",
      }),
      // Consumed solid line
      h("polyline", {
        points: consumed.map((v, i) => `${xp(i)},${yp(v)}`).join(" "),
        fill: "none", stroke: av.color, strokeWidth: "2.5", strokeLinejoin: "round", strokeLinecap: "round",
      }),
      // Data point dots
      consumed.map((v, i) =>
        h("circle", {
          key: i, cx: xp(i), cy: yp(v), r: 4.5,
          fill: targets[i] > 0 && v > targets[i] ? "#C4786A" : av.color,
          stroke: M.card, strokeWidth: "2",
        })
      ),
      // X-axis day labels
      weekData.map((d, i) =>
        h("text", {
          key: i, x: xp(i), y: H - 4, fontSize: "10",
          fill: i === todayDow ? av.color : M.muted,
          textAnchor: "middle", fontWeight: i === todayDow ? 700 : 400,
        }, d.label)
      )
    ),

    // Day summary tiles
    h("div", { style: { display: "flex", gap: 5, marginTop: 10 } },
      weekData.map((d, i) => {
        const v    = d[view];
        const diff = v.c - v.t;
        const over = v.t > 0 && diff > 0;
        return h("div", {
          key: i,
          style: {
            flex: 1, background: i === todayDow ? M.light : M.card,
            border: `1px solid ${i === todayDow ? av.color : M.border}`,
            borderRadius: 8, padding: "5px 3px", textAlign: "center",
          },
        },
          h("div", {
            style: {
              fontSize: 10, marginBottom: 2,
              color: i === todayDow ? av.color : M.muted,
              fontWeight: i === todayDow ? 600 : 400,
            },
          }, d.label),
          h("div", {
            style: {
              fontSize: F.x, fontWeight: 500,
              color: over ? "#C4786A" : v.c > 0 ? av.color : M.border,
            },
          }, v.c || "—"),
          v.t > 0 && v.c > 0 && h("div", {
            style: { fontSize: 10, color: over ? "#C4786A" : M.sage },
          }, (over ? "+" : ""), diff)
        );
      })
    )
  );
}

// ─── Dash ─────────────────────────────────────────────────────────
// Dashboard tab: today's macro summary, weight graph, weekly chart.
// Props: base, logs, wlog, upW, sc, t, F
function Dash({ base, logs, wlog, upW, sc, t, F }) {
  const [wi, setWi] = useState("");

  const today = dk(new Date());
  const tl    = logs[today] || ed();
  const m     = gm(tl);
  const tn    = DAYS[todayDowIndex()];
  const ts    = sc[tn] || { type: "rest" };
  const tgt   = calcDay(base, ts);

  // Last 30 days of weight entries
  const l30 = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    l30.push(dk(d));
  }
  const wd = l30.map(k => ({ k, w: wlog[k] || null })).filter(d => d.w);
  const gw = base?.tw || null;

  // Inline weight graph (SVG)
  function WeightGraph() {
    if (wd.length < 2) {
      return h("div", { style: { fontSize: F.s, color: M.muted, padding: "1rem 0", textAlign: "center" } }, t.nodata);
    }
    const vs = wd.map(d => d.w);
    const av = [...vs];
    if (gw) av.push(gw);
    const mn = Math.min(...av) - 1;
    const mx = Math.max(...av) + 1;
    const W = 560, H = 110, pd = 16;
    const xp = i => pd + (i / (wd.length - 1)) * (W - pd * 2);
    const yp = v => H - pd - ((v - mn) / (mx - mn)) * (H - pd * 2);

    return h("svg", { viewBox: `0 0 ${W} ${H}`, style: { width: "100%", height: H } },
      h("polyline", {
        points: wd.map((d, i) => `${xp(i)},${yp(d.w)}`).join(" "),
        fill: "none", stroke: M.sage, strokeWidth: "2.5", strokeLinejoin: "round",
      }),
      wd.map((d, i) => h("circle", { key: i, cx: xp(i), cy: yp(d.w), r: 3.5, fill: M.sage })),
      gw && h("line", { x1: pd, y1: yp(gw), x2: W - pd, y2: yp(gw), stroke: M.blush, strokeWidth: "1.5", strokeDasharray: "5,4" }),
      h("text", { x: pd, y: yp(vs[vs.length - 1]) - 7, fontSize: "11", fill: M.sage }, vs[vs.length - 1] + "kg"),
      gw && h("text", { x: W - pd, y: yp(gw) - 6, fontSize: "11", fill: M.blush, textAnchor: "end" }, "goal " + gw + "kg")
    );
  }

  return h("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },

    // Setup nudge
    !base && h(Card, null,
      h("p", { style: { fontSize: F.s, color: M.clay, margin: 0 } }, t.setupmsg)
    ),

    // Today's schedule badge
    h("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
      h("span", { style: { fontSize: F.m, fontWeight: 500, color: M.text } }, t.tsched + ":"),
      h("span", {
        style: {
          padding: "3px 12px", borderRadius: 20, fontSize: F.x, fontWeight: 500,
          background: TAG[ts.type]?.bg || M.light,
          color: TAG[ts.type]?.text || M.muted,
        },
      }, t.dtypes[ts.type]),
      ts.wtype && ts.type === "workout" &&
        h("span", { style: { fontSize: F.s, color: M.muted } }, ts.wtype)
    ),

    // Remaining macros + progress bars
    tgt && h(Card, null,
      h(SLbl, { label: t.dgoals, F, color: M.clay }),

      // Calories left / Protein left tiles
      h("div", { style: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, marginBottom: 16 } },
        [
          { label: t.calleft,  val: Math.max(0, tgt.cal  - m.cal),  unit: " kcal", sub: `${t.tgt} ${tgt.cal} kcal`,  color: M.clay     },
          { label: t.protleft, val: Math.max(0, tgt.prot - m.prot), unit: "g",     sub: `${t.tgt} ${tgt.prot}g`,      color: M.lavender },
        ].map(({ label, val, unit, sub, color }) =>
          h("div", {
            key: label,
            style: { background: M.light, borderRadius: 12, padding: "12px 14px", border: `1px solid ${M.border}` },
          },
            h("div", { style: { fontSize: F.x, color: M.muted, marginBottom: 4 } }, label),
            h("div", { style: { fontSize: F.b + 6, fontWeight: 600, color } },
              val,
              h("span", { style: { fontSize: F.x, fontWeight: 400, marginLeft: 2, color: M.muted } }, unit)
            ),
            h("div", { style: { fontSize: F.x, color: M.muted, marginTop: 2 } }, sub)
          )
        )
      ),

      // Macro progress bars
      h("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
        h(MPill, { label: t.cal,  val: m.cal,  max: tgt.cal,  color: MCOL.cal,  unit: " kcal", F }),
        h(MPill, { label: t.prot, val: m.prot, max: tgt.prot, color: MCOL.prot, unit: "g",     F }),
        h(MPill, { label: t.carb, val: m.carb, max: tgt.carb, color: MCOL.carb, unit: "g",     F }),
        h(MPill, { label: t.fat,  val: m.fat,  max: tgt.fat,  color: MCOL.fat,  unit: "g",     F })
      )
    ),

    // Weight graph card
    h(Card, null,
      h(SLbl, { label: t.wtitle, F, color: M.mist }),
      h(WeightGraph),
      h("div", { style: { display: "flex", gap: 8, marginTop: 14 } },
        h(Inp, { value: wi, onChange: e => setWi(e.target.value), placeholder: t.wph, type: "number", F, style: { flex: 1 } }),
        h("button", {
          onClick: () => { if (wi) { upW(today, wi); setWi(""); } },
          style: {
            padding: "10px 18px", fontSize: F.s,
            border: `1px solid ${M.mist}`, borderRadius: 10,
            background: M.mist, color: "#fff", cursor: "pointer",
            fontWeight: 500, whiteSpace: "nowrap",
          },
        }, t.wlog)
      )
    ),

    // Weekly chart card
    h(Card, null,
      h(WeeklyChart, { logs, base, sc, t, F })
    )
  );
}

// ─── LFShell ──────────────────────────────────────────────────────
// Shared shell for the Log Food tab: date nav, macro bars, water card,
// logged meal lists. The add-food UI is injected via children(selDate, MKEYS, MLABS).
// Props: logs, upLog, base, sc, t, F, children(fn)
function LFShell({ logs, upLog, base, sc, t, F, children }) {
  const [selDate, setSelDate] = useState(dk(new Date()));
  const todayK = dk(new Date());
  const yestK  = dk(new Date(Date.now() - 86400000));

  const dayLog = logs[selDate] || ed();
  const sidx   = new Date(selDate + "T12:00:00").getDay();
  const sday   = DAYS[sidx === 0 ? 6 : sidx - 1];
  const tgt    = calcDay(base, sc[sday] || { type: "rest" });
  const m      = gm(dayLog);

  const MKEYS = ["breakfast", "lunch", "dinner", "snacks"];
  const MLABS = [t.bfast, t.lunch, t.dinner, t.snacks];
  const MEAL_COLORS = [M.clay, M.sage, M.lavender, M.blush];

  function prevDay() {
    const d = new Date(selDate);
    d.setDate(d.getDate() - 1);
    setSelDate(dk(d));
  }
  function nextDay() {
    const d = new Date(selDate);
    d.setDate(d.getDate() + 1);
    if (dk(d) <= todayK) setSelDate(dk(d));
  }
  function ddisplay() {
    if (selDate === todayK) return t.today;
    if (selDate === yestK)  return t.yest;
    return selDate;
  }
  function rm(mk, idx) {
    upLog(selDate, day => ({
      ...day,
      meals: { ...day.meals, [mk]: day.meals[mk].filter((_, i) => i !== idx) },
    }));
  }

  return h("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },

    // Date navigator
    h(Card, { style: { padding: "0.75rem 1.25rem" } },
      h("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
        h("button", {
          onClick: prevDay,
          style: {
            padding: "4px 14px", border: `1px solid ${M.border}`,
            borderRadius: 10, background: M.light, color: M.muted,
            cursor: "pointer", fontSize: F.b + 2,
          },
        }, "‹"),
        h("span", { style: { flex: 1, textAlign: "center", fontSize: F.m, fontWeight: 500, color: M.text } }, ddisplay()),
        h("button", {
          onClick: nextDay,
          disabled: selDate >= todayK,
          style: {
            padding: "4px 14px", border: `1px solid ${M.border}`,
            borderRadius: 10, background: M.light,
            color: selDate >= todayK ? M.border : M.muted,
            cursor: selDate >= todayK ? "default" : "pointer",
            fontSize: F.b + 2,
          },
        }, "›")
      )
    ),

    // Macro progress bars
    tgt && h(Card, { style: { padding: "0.75rem 1.25rem" } },
      h("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
        h(MPill, { label: t.cal,  val: m.cal,  max: tgt.cal,  color: MCOL.cal,  unit: " kcal", F }),
        h(MPill, { label: t.prot, val: m.prot, max: tgt.prot, color: MCOL.prot, unit: "g",     F }),
        h(MPill, { label: t.carb, val: m.carb, max: tgt.carb, color: MCOL.carb, unit: "g",     F }),
        h(MPill, { label: t.fat,  val: m.fat,  max: tgt.fat,  color: MCOL.fat,  unit: "g",     F })
      )
    ),

    // Water card
    h(Card, null,
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
        h(SLbl, { label: t.wlabel, F, color: M.mist }),
        h("span", { style: { fontSize: F.s, color: M.muted } },
          Math.round(dayLog.water || 0) + " / " + (tgt?.water || 2200) + " ml"
        )
      ),
      h(MPill, { label: "", val: Math.round(dayLog.water || 0), max: tgt?.water || 2200, color: MCOL.water, unit: " ml", F }),
      h("div", { style: { display: "flex", gap: 6, marginTop: 10 } },
        [150, 250, 350, 500].map(ml =>
          h("button", {
            key: ml,
            onClick: () => upLog(selDate, d => ({ ...d, water: (d.water || 0) + ml })),
            style: {
              flex: 1, padding: "7px 0", fontSize: F.x,
              border: `1px solid ${M.border}`, borderRadius: 10,
              background: M.light, color: M.muted, cursor: "pointer", fontWeight: 500,
            },
          }, "+" + ml)
        )
      ),
      (dayLog.water || 0) > 0 &&
        h("button", {
          onClick: () => upLog(selDate, d => ({ ...d, water: 0 })),
          style: { marginTop: 6, fontSize: F.x, border: "none", background: "none", color: M.dusty, cursor: "pointer", textDecoration: "underline" },
        }, t.wreset)
    ),

    // Injected add-food UI
    children(selDate, MKEYS, MLABS),

    // Logged meals
    MKEYS.map((mk, i) => {
      const items = dayLog.meals[mk] || [];
      if (!items.length) return null;
      const tot = items.reduce((a, x) => ({ cal: a.cal + (x.cal || 0), prot: a.prot + (x.prot || 0) }), { cal: 0, prot: 0 });
      const mc  = MEAL_COLORS[i];

      return h(Card, { key: mk },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } },
          h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
            h("div", { style: { width: 4, height: 16, borderRadius: 2, background: mc } }),
            h("span", { style: { fontWeight: 500, fontSize: F.m, color: M.text } }, MLABS[i])
          ),
          h("span", {
            style: {
              fontSize: F.x, color: M.muted, background: M.light,
              padding: "2px 10px", borderRadius: 20, border: `1px solid ${M.border}`,
            },
          }, Math.round(tot.cal) + " kcal · " + Math.round(tot.prot) + "g P")
        ),
        items.map((item, idx) =>
          h("div", {
            key: idx,
            style: {
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 10px", borderRadius: 8,
              background: idx % 2 === 0 ? M.light : M.card,
              marginBottom: 4, fontSize: F.s,
            },
          },
            h("span", { style: { flex: 1, color: M.text } }, item.name),
            h("span", { style: { color: M.muted, marginRight: 10 } },
              Math.round(item.cal || 0) + " kcal · " + Math.round(item.prot || 0) + "g P"
            ),
            h("button", {
              onClick: () => rm(mk, idx),
              style: { border: "none", background: "none", color: M.dusty, cursor: "pointer", fontSize: F.m, padding: 0, lineHeight: 1 },
            }, "×")
          )
        )
      );
    })
  );
}

// ─── OwnerLogFood ─────────────────────────────────────────────────
// Owner-only Log Food tab: AI section (text + photo → macro JSON via
// Render proxy) stacked above the standard DB search + manual entry.
// Props: logs, upLog, base, sc, t, F, lang
function OwnerLogFood({ logs, upLog, base, sc, t, F, lang }) {
  // ── AI section state ──
  const [meal,    setMeal]    = useState("breakfast");
  const [inp,     setInp]     = useState("");
  const [img,     setImg]     = useState(null);   // { data, type, preview }
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");
  const fRef = useRef();

  // ── DB section state (mirrors LogFood) ──
  const [q,     setQ]     = useState("");
  const [res,   setRes]   = useState([]);
  const [sel,   setSel]   = useState(null);
  const [srv,   setSrv]   = useState(1);
  const [cook,  setCook]  = useState("raw");
  const [showM, setShowM] = useState(false);
  const [man,   setMan]   = useState({ name: "", cal: "", prot: "", carb: "", fat: "" });

  const isRaw   = sel && RAW_TYPES.includes(sel.t);
  const cookAdj = COOKING.adj[cook] || { cal: 0, fat: 0 };
  const adjCal  = isRaw ? sel.cal + cookAdj.cal : sel ? sel.cal : 0;
  const adjFat  = isRaw ? sel.f   + cookAdj.fat : sel ? sel.f   : 0;

  const ready = !!PROXY_URL;   // false → greyed-out AI button

  const MEAL_COLORS = [M.clay, M.sage, M.lavender, M.blush];
  const MKEYS_LOCAL = ["breakfast", "lunch", "dinner", "snacks"];

  // Live DB search
  useEffect(() => {
    if (!q.trim()) { setRes([]); return; }
    const qq = q.toLowerCase().trim();
    setRes(DB.filter(f => f.n.toLowerCase().includes(qq) || (f.z && f.z.includes(qq))).slice(0, 8));
    setSel(null);
  }, [q]);

  // ── AI analyze ───────────────────────────────────────────────────
  async function analyze(selDate) {
    if (!inp.trim() && !img) return;
    setLoading(true); setErr("");
    try {
      const body = { description: inp.trim() };
      if (img) { body.imageData = img.data; body.imageType = img.type; }

      const fetchPromise   = fetch(PROXY_URL + "/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), 60000)  // 60s — handles Render cold start
      );

      const r = await Promise.race([fetchPromise, timeoutPromise]);
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Server error " + r.status);
      }
      const items = await r.json();
      upLog(selDate, day => ({
        ...day,
        meals: { ...day.meals, [meal]: [...(day.meals[meal] || []), ...items] },
      }));
      setInp(""); setImg(null);
    } catch (e) {
      setErr(e.message === "TIMEOUT"
        ? "Server is waking up — please try again in a moment."
        : "Error: " + e.message);
    }
    setLoading(false);
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => setImg({ data: ev.target.result.split(",")[1], type: file.type, preview: ev.target.result });
    r.readAsDataURL(file);
    e.target.value = "";
  }

  // ── DB helpers (same logic as LogFood) ───────────────────────────
  function addSel(selDate) {
    if (!sel) return;
    const finalCal  = Math.round(adjCal * srv);
    const finalFat  = Math.max(0, Math.round(adjFat * srv));
    const cookIdx   = COOKING.keys.indexOf(cook);
    const cookLabel = isRaw && cook !== "raw"
      ? (lang === "zh" ? COOKING.zh[cookIdx] : COOKING.en[cookIdx]) : "";
    const name = sel.n + (cookLabel ? ` (${cookLabel})` : "") + (srv !== 1 ? ` ×${srv}` : "");
    upLog(selDate, day => ({
      ...day,
      meals: {
        ...day.meals,
        [meal]: [...(day.meals[meal] || []), {
          name, cal: finalCal,
          prot: Math.round(sel.p * srv),
          carb: Math.round(sel.c * srv),
          fat:  finalFat,
        }],
      },
    }));
    setSel(null); setQ(""); setRes([]); setCook("raw");
  }

  function addMan(selDate) {
    if (!man.name || !man.cal) return;
    upLog(selDate, day => ({
      ...day,
      meals: {
        ...day.meals,
        [meal]: [...(day.meals[meal] || []), {
          name: man.name,
          cal:  parseFloat(man.cal)  || 0,
          prot: parseFloat(man.prot) || 0,
          carb: parseFloat(man.carb) || 0,
          fat:  parseFloat(man.fat)  || 0,
        }],
      },
    }));
    setMan({ name: "", cal: "", prot: "", carb: "", fat: "" });
    setShowM(false);
  }

  return h(LFShell, { logs, upLog, base, sc, t, F },
    (selDate, MKEYS, MLABS) => h("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },

      // ── AI card ─────────────────────────────────────────────────
      h(Card, null,
        h("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 } },
          h(SLbl, { label: "✦ AI Food Log", F, color: M.clay }),
          !ready && h("span", {
            style: {
              fontSize: F.x, color: M.dusty, padding: "2px 10px",
              border: `1px solid ${M.border}`, borderRadius: 20, background: M.light,
            },
          }, lang === "zh" ? "後端未設定" : "Backend not configured")
        ),

        // Meal selector
        h("div", { style: { display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" } },
          MKEYS.map((k, i) =>
            h("button", {
              key: k,
              onClick: () => setMeal(k),
              style: {
                padding: "6px 16px", fontSize: F.s,
                border: `1px solid ${meal === k ? MEAL_COLORS[i] : M.border}`,
                borderRadius: 20,
                background: meal === k ? MEAL_COLORS[i] : "transparent",
                color: meal === k ? "#fff" : M.muted,
                cursor: "pointer", fontWeight: meal === k ? 500 : 400,
                opacity: ready ? 1 : 0.55,
              },
            }, MLABS[i])
          )
        ),

        // Text input
        h("textarea", {
          value: inp,
          onChange: e => setInp(e.target.value),
          placeholder: t.aiph,
          disabled: !ready,
          style: {
            width: "100%", minHeight: 72, padding: "10px 14px",
            fontSize: F.s, border: `1px solid ${M.border}`,
            borderRadius: 10, background: ready ? M.card : M.light,
            color: ready ? M.text : M.muted,
            resize: "vertical", boxSizing: "border-box",
            marginBottom: 10, outline: "none",
            fontFamily: "system-ui,-apple-system,sans-serif",
            opacity: ready ? 1 : 0.65,
          },
        }),

        // Image preview
        img && h("div", { style: { marginBottom: 10, position: "relative", display: "inline-block" } },
          h("img", { src: img.preview, alt: "", style: { maxHeight: 100, borderRadius: 10, border: `1px solid ${M.border}` } }),
          h("button", {
            onClick: () => setImg(null),
            style: {
              position: "absolute", top: 4, right: 4,
              border: "none", background: "rgba(74,69,64,0.7)", color: "#fff",
              borderRadius: "50%", width: 20, height: 20,
              fontSize: 11, cursor: "pointer", lineHeight: "20px", padding: 0,
            },
          }, "×")
        ),

        // Buttons row
        h("div", { style: { display: "flex", gap: 8 } },
          h("button", {
            onClick: () => fRef.current && fRef.current.click(),
            disabled: !ready,
            style: {
              padding: "9px 16px", fontSize: F.s,
              border: `1px solid ${M.border}`, borderRadius: 10,
              background: M.light, color: M.muted,
              cursor: ready ? "pointer" : "default",
              opacity: ready ? 1 : 0.5,
            },
          }, t.upph),
          h("input", { ref: fRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: handleFile }),
          h("button", {
            onClick: () => analyze(selDate),
            disabled: !ready || loading || (!inp.trim() && !img),
            style: {
              padding: "9px 20px", fontSize: F.s, fontWeight: 500,
              border: `1px solid ${ready ? M.clay : M.border}`,
              borderRadius: 10,
              background: ready ? M.clay : M.light,
              color: ready ? "#fff" : M.muted,
              cursor: (ready && !loading && (inp.trim() || img)) ? "pointer" : "default",
              opacity: (!ready || (!inp.trim() && !img && !loading)) ? 0.5 : 1,
            },
          }, loading ? t.analyzing : t.logbtn)
        ),

        err && h("p", { style: { fontSize: F.x, color: "#C4786A", marginTop: 8, marginBottom: 0 } }, err)
      ),

      // ── DB search card ───────────────────────────────────────────
      h(Card, null,
        h("div", { style: { display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" } },
          MKEYS.map((k, i) =>
            h("button", {
              key: k,
              onClick: () => setMeal(k),
              style: {
                padding: "6px 16px", fontSize: F.s,
                border: `1px solid ${meal === k ? MEAL_COLORS[i] : M.border}`,
                borderRadius: 20,
                background: meal === k ? MEAL_COLORS[i] : "transparent",
                color: meal === k ? "#fff" : M.muted,
                cursor: "pointer", fontWeight: meal === k ? 500 : 400,
              },
            }, MLABS[i])
          )
        ),

        h(SLbl, { label: t.searchFood, F, color: M.sage }),
        h(Inp, { value: q, onChange: e => setQ(e.target.value), placeholder: t.sph, F, style: { marginBottom: 10 } }),

        // Results list
        res.length > 0 && !sel &&
          h("div", {
            style: {
              border: `1px solid ${M.border}`, borderRadius: 10, overflow: "hidden",
              marginBottom: 10, background: M.card,
            },
          },
            res.map((f, i) =>
              h("button", {
                key: i,
                onClick: () => { setSel(f); setSrv(1); setCook("raw"); setRes([]); },
                style: {
                  width: "100%", textAlign: "left", padding: "9px 14px",
                  background: i % 2 === 0 ? M.light : M.card,
                  border: "none", borderBottom: i < res.length - 1 ? `1px solid ${M.border}` : "none",
                  cursor: "pointer", fontSize: F.s, color: M.text,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                },
              },
                h("span", null, lang === "zh" && f.z ? f.z + " / " + f.n : f.n),
                h("span", { style: { color: M.muted, fontSize: F.x } }, f.cal + " kcal / " + f.u)
              )
            )
          ),

        // Selected item detail
        sel && h("div", {
          style: {
            padding: "12px 14px", background: M.light, borderRadius: 10,
            border: `1px solid ${M.border}`, marginBottom: 10,
          },
        },
          h("div", { style: { fontWeight: 500, fontSize: F.m, marginBottom: 6, color: M.text } },
            lang === "zh" && sel.z ? sel.z + " / " + sel.n : sel.n
          ),

          isRaw && h("div", { style: { marginBottom: 10 } },
            h("div", { style: { fontSize: F.x, color: M.muted, marginBottom: 6, fontWeight: 500 } }, t.cookMethod),
            h("div", { style: { display: "flex", flexWrap: "wrap", gap: 5 } },
              COOKING.keys.map((k, i) =>
                h("button", {
                  key: k,
                  onClick: () => setCook(k),
                  style: {
                    padding: "4px 10px", fontSize: F.x,
                    border: `1px solid ${cook === k ? M.clay : M.border}`,
                    borderRadius: 20,
                    background: cook === k ? M.clay : "transparent",
                    color: cook === k ? "#fff" : M.muted,
                    cursor: "pointer", fontWeight: cook === k ? 500 : 400,
                  },
                }, lang === "zh" ? COOKING.zh[i] : COOKING.en[i])
              )
            ),
            cook !== "raw" && h("div", { style: { fontSize: F.x, color: M.clay, marginTop: 5 } },
              (cookAdj.cal > 0 ? "+" + cookAdj.cal : cookAdj.cal) +
              " kcal, " +
              (cookAdj.fat > 0 ? "+" + cookAdj.fat : cookAdj.fat) + "g fat per 100g"
            )
          ),

          h("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 } },
            h("label", { style: { fontSize: F.x, color: M.muted, whiteSpace: "nowrap" } }, t.fsrv),
            h("input", {
              type: "range", min: 0.25, max: 5, step: 0.25, value: srv,
              onChange: e => setSrv(parseFloat(e.target.value)),
              style: { flex: 1, accentColor: M.sage },
            }),
            h("input", {
              type: "number", min: 0.25, max: 20, step: 0.25, value: srv,
              onChange: e => setSrv(parseFloat(e.target.value) || 1),
              style: {
                width: 56, padding: "6px 8px", fontSize: F.s,
                border: `1px solid ${M.border}`, borderRadius: 8,
                background: M.card, color: M.text, textAlign: "center", outline: "none",
              },
            }),
            h("span", { style: { fontSize: F.x, color: M.muted, whiteSpace: "nowrap" } }, sel.u)
          ),

          h("div", { style: { fontSize: F.x, color: M.sage, fontWeight: 500, marginBottom: 12 } },
            "Total: " + Math.round(adjCal * srv) + " kcal · " +
            Math.round(sel.p * srv) + "g P · " +
            Math.round(sel.c * srv) + "g C · " +
            Math.max(0, Math.round(adjFat * srv)) + "g F"
          ),

          h("div", { style: { display: "flex", gap: 8 } },
            h("button", {
              onClick: () => addSel(selDate),
              style: {
                flex: 1, padding: "9px", fontSize: F.s, fontWeight: 500,
                border: `1px solid ${M.sage}`, borderRadius: 10,
                background: M.sage, color: "#fff", cursor: "pointer",
              },
            }, t.fadd),
            h("button", {
              onClick: () => setSel(null),
              style: {
                padding: "9px 14px", fontSize: F.s,
                border: `1px solid ${M.border}`, borderRadius: 10,
                background: "transparent", color: M.muted, cursor: "pointer",
              },
            }, "×")
          )
        ),

        res.length === 0 && q.trim() && !sel &&
          h("p", { style: { fontSize: F.s, color: M.muted, margin: "4px 0 8px" } }, t.nores),

        h("button", {
          onClick: () => setShowM(!showM),
          style: {
            fontSize: F.x, border: "none", background: "none",
            color: M.dusty, cursor: "pointer", padding: 0,
            marginTop: 4, textDecoration: "underline",
          },
        }, (showM ? "▲ " : "▼ ") + t.manual),

        showM && h("div", {
          style: {
            display: "flex", flexDirection: "column", gap: 8,
            padding: "14px", background: M.light, borderRadius: 12,
            marginTop: 10, border: `1px solid ${M.border}`,
          },
        },
          h(Inp, { value: man.name, onChange: e => setMan({ ...man, name: e.target.value }), placeholder: t.fname, F }),
          h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } },
            h(Inp, { value: man.cal,  onChange: e => setMan({ ...man, cal:  e.target.value }), placeholder: t.fcal,          type: "number", F }),
            h(Inp, { value: man.prot, onChange: e => setMan({ ...man, prot: e.target.value }), placeholder: t.prot + " (g)", type: "number", F }),
            h(Inp, { value: man.carb, onChange: e => setMan({ ...man, carb: e.target.value }), placeholder: t.carb + " (g)", type: "number", F }),
            h(Inp, { value: man.fat,  onChange: e => setMan({ ...man, fat:  e.target.value }), placeholder: t.fat  + " (g)", type: "number", F })
          ),
          h("button", {
            onClick: () => addMan(selDate),
            disabled: !man.name || !man.cal,
            style: {
              padding: "9px", fontSize: F.s, fontWeight: 500,
              border: `1px solid ${M.clay}`, borderRadius: 10,
              background: M.clay, color: "#fff", cursor: "pointer",
            },
          }, t.fadd)
        )
      )
    )
  );
}

// ─── LogFood ──────────────────────────────────────────────────────
// Log Food tab: DB search with cooking-method selector, servings slider,
// and manual entry fallback.
// Props: logs, upLog, base, sc, t, F, lang
function LogFood({ logs, upLog, base, sc, t, F, lang }) {
  const [meal,  setMeal]  = useState("breakfast");
  const [q,     setQ]     = useState("");
  const [res,   setRes]   = useState([]);
  const [sel,   setSel]   = useState(null);
  const [srv,   setSrv]   = useState(1);
  const [cook,  setCook]  = useState("raw");
  const [showM, setShowM] = useState(false);
  const [man,   setMan]   = useState({ name: "", cal: "", prot: "", carb: "", fat: "" });

  const isRaw  = sel && RAW_TYPES.includes(sel.t);
  const cookAdj = COOKING.adj[cook] || { cal: 0, fat: 0 };
  const adjCal  = isRaw ? sel.cal + cookAdj.cal : sel ? sel.cal : 0;
  const adjFat  = isRaw ? sel.f  + cookAdj.fat  : sel ? sel.f  : 0;

  // Live search as query changes
  useEffect(() => {
    if (!q.trim()) { setRes([]); return; }
    const qq = q.toLowerCase().trim();
    setRes(DB.filter(f => f.n.toLowerCase().includes(qq) || (f.z && f.z.includes(qq))).slice(0, 8));
    setSel(null);
  }, [q]);

  function addSel(selDate) {
    if (!sel) return;
    const finalCal = Math.round(adjCal * srv);
    const finalFat = Math.max(0, Math.round(adjFat * srv));
    const cookIdx  = COOKING.keys.indexOf(cook);
    const cookLabel = isRaw && cook !== "raw"
      ? (lang === "zh" ? COOKING.zh[cookIdx] : COOKING.en[cookIdx])
      : "";
    const name = sel.n + (cookLabel ? ` (${cookLabel})` : "") + (srv !== 1 ? ` ×${srv}` : "");
    upLog(selDate, day => ({
      ...day,
      meals: {
        ...day.meals,
        [meal]: [...(day.meals[meal] || []), {
          name,
          cal:  finalCal,
          prot: Math.round(sel.p * srv),
          carb: Math.round(sel.c * srv),
          fat:  finalFat,
        }],
      },
    }));
    setSel(null); setQ(""); setRes([]); setCook("raw");
  }

  function addMan(selDate) {
    if (!man.name || !man.cal) return;
    upLog(selDate, day => ({
      ...day,
      meals: {
        ...day.meals,
        [meal]: [...(day.meals[meal] || []), {
          name: man.name,
          cal:  parseFloat(man.cal)  || 0,
          prot: parseFloat(man.prot) || 0,
          carb: parseFloat(man.carb) || 0,
          fat:  parseFloat(man.fat)  || 0,
        }],
      },
    }));
    setMan({ name: "", cal: "", prot: "", carb: "", fat: "" });
    setShowM(false);
  }

  const MEAL_COLORS = [M.clay, M.sage, M.lavender, M.blush];
  const MKEYS = ["breakfast", "lunch", "dinner", "snacks"];

  return h(LFShell, { logs, upLog, base, sc, t, F },
    (selDate, MKEYS, MLABS) =>
      h(Card, null,

        // Meal selector tabs
        h("div", { style: { display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" } },
          MKEYS.map((k, i) =>
            h("button", {
              key: k,
              onClick: () => setMeal(k),
              style: {
                padding: "6px 16px", fontSize: F.s,
                border: `1px solid ${meal === k ? MEAL_COLORS[i] : M.border}`,
                borderRadius: 20,
                background: meal === k ? MEAL_COLORS[i] : "transparent",
                color: meal === k ? "#fff" : M.muted,
                cursor: "pointer", fontWeight: meal === k ? 500 : 400,
              },
            }, MLABS[i])
          )
        ),

        h(SLbl, { label: t.searchFood, F, color: M.sage }),
        h(Inp, { value: q, onChange: e => setQ(e.target.value), placeholder: t.sph, F, style: { marginBottom: 10 } }),

        // Search results dropdown
        res.length > 0 && !sel &&
          h("div", {
            style: {
              borderRadius: 10, border: `1px solid ${M.border}`,
              overflow: "hidden", marginBottom: 10, maxHeight: 220, overflowY: "auto",
            },
          },
            res.map((r, i) =>
              h("button", {
                key: i,
                onClick: () => { setSel(r); setSrv(1); setCook("raw"); },
                style: {
                  width: "100%", padding: "10px 14px", border: "none",
                  borderBottom: i < res.length - 1 ? `1px solid ${M.border}` : "none",
                  background: i % 2 === 0 ? M.card : M.light,
                  color: M.text, cursor: "pointer", textAlign: "left",
                  fontSize: F.s, display: "block",
                },
              },
                h("div", { style: { fontWeight: 500 } },
                  r.n,
                  r.z && h("span", { style: { color: M.muted, fontWeight: 400, marginLeft: 8, fontSize: F.x } }, r.z),
                  RAW_TYPES.includes(r.t) &&
                    h("span", {
                      style: {
                        fontSize: F.x, marginLeft: 6, color: M.sage,
                        border: `1px solid ${M.sage}`, borderRadius: 10, padding: "1px 6px",
                      },
                    }, "🍳")
                ),
                h("div", { style: { color: M.muted, fontSize: F.x, marginTop: 2 } },
                  r.cal + " kcal · " + r.p + "g P · " + r.c + "g C · " + r.f + "g F / " + r.u
                )
              )
            )
          ),

        // No results hint
        q.length > 1 && res.length === 0 && !sel &&
          h("p", { style: { fontSize: F.x, color: M.dusty, marginBottom: 10, fontStyle: "italic" } }, t.nores),

        // Selected item detail panel
        sel && h("div", {
          style: { padding: "14px", background: M.light, borderRadius: 12, marginBottom: 10, border: `1px solid ${M.border}` },
        },
          // Name + base nutrition
          h("div", { style: { fontSize: F.s, fontWeight: 500, marginBottom: 4, color: M.text } },
            sel.n,
            sel.z && h("span", { style: { color: M.muted, fontWeight: 400, marginLeft: 8, fontSize: F.x } }, sel.z)
          ),
          h("div", { style: { fontSize: F.x, color: M.muted, marginBottom: 10 } },
            "per " + sel.u + ": " + sel.cal + " kcal · " + sel.p + "g P · " + sel.c + "g C · " + sel.f + "g F"
          ),

          // Cooking method selector (only for raw-type foods)
          isRaw && h("div", { style: { marginBottom: 10 } },
            h("div", { style: { fontSize: F.x, color: M.muted, marginBottom: 6, fontWeight: 500 } }, t.cookMethod),
            h("div", { style: { display: "flex", flexWrap: "wrap", gap: 5 } },
              COOKING.keys.map((k, i) =>
                h("button", {
                  key: k,
                  onClick: () => setCook(k),
                  style: {
                    padding: "4px 10px", fontSize: F.x,
                    border: `1px solid ${cook === k ? M.clay : M.border}`,
                    borderRadius: 20,
                    background: cook === k ? M.clay : "transparent",
                    color: cook === k ? "#fff" : M.muted,
                    cursor: "pointer", fontWeight: cook === k ? 500 : 400,
                  },
                }, lang === "zh" ? COOKING.zh[i] : COOKING.en[i])
              )
            ),
            cook !== "raw" && h("div", { style: { fontSize: F.x, color: M.clay, marginTop: 5 } },
              (cookAdj.cal > 0 ? "+" + cookAdj.cal : cookAdj.cal) +
              " kcal, " +
              (cookAdj.fat > 0 ? "+" + cookAdj.fat : cookAdj.fat) +
              "g fat per 100g"
            )
          ),

          // Servings slider
          h("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 } },
            h("label", { style: { fontSize: F.x, color: M.muted, whiteSpace: "nowrap" } }, t.fsrv),
            h("input", {
              type: "range", min: 0.25, max: 5, step: 0.25, value: srv,
              onChange: e => setSrv(parseFloat(e.target.value)),
              style: { flex: 1, accentColor: M.sage },
            }),
            h("input", {
              type: "number", min: 0.25, max: 20, step: 0.25, value: srv,
              onChange: e => setSrv(parseFloat(e.target.value) || 1),
              style: {
                width: 56, padding: "6px 8px", fontSize: F.s,
                border: `1px solid ${M.border}`, borderRadius: 8,
                background: M.card, color: M.text, textAlign: "center", outline: "none",
              },
            }),
            h("span", { style: { fontSize: F.x, color: M.muted, whiteSpace: "nowrap" } }, sel.u)
          ),

          // Adjusted total
          h("div", { style: { fontSize: F.x, color: M.sage, fontWeight: 500, marginBottom: 12 } },
            "Total: " + Math.round(adjCal * srv) + " kcal · " +
            Math.round(sel.p * srv) + "g P · " +
            Math.round(sel.c * srv) + "g C · " +
            Math.max(0, Math.round(adjFat * srv)) + "g F"
          ),

          // Add / cancel
          h("div", { style: { display: "flex", gap: 8 } },
            h("button", {
              onClick: () => addSel(selDate),
              style: {
                flex: 1, padding: "9px", fontSize: F.s, fontWeight: 500,
                border: `1px solid ${M.sage}`, borderRadius: 10,
                background: M.sage, color: "#fff", cursor: "pointer",
              },
            }, t.fadd),
            h("button", {
              onClick: () => setSel(null),
              style: {
                padding: "9px 14px", fontSize: F.s,
                border: `1px solid ${M.border}`, borderRadius: 10,
                background: "transparent", color: M.muted, cursor: "pointer",
              },
            }, "×")
          )
        ),

        // Manual entry toggle
        h("button", {
          onClick: () => setShowM(!showM),
          style: {
            fontSize: F.x, border: "none", background: "none",
            color: M.dusty, cursor: "pointer", padding: 0,
            marginTop: 4, textDecoration: "underline",
          },
        }, (showM ? "▲ " : "▼ ") + t.manual),

        // Manual entry form
        showM && h("div", {
          style: {
            display: "flex", flexDirection: "column", gap: 8,
            padding: "14px", background: M.light, borderRadius: 12,
            marginTop: 10, border: `1px solid ${M.border}`,
          },
        },
          h(Inp, { value: man.name, onChange: e => setMan({ ...man, name: e.target.value }), placeholder: t.fname, F }),
          h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } },
            h(Inp, { value: man.cal,  onChange: e => setMan({ ...man, cal:  e.target.value }), placeholder: t.fcal,           type: "number", F }),
            h(Inp, { value: man.prot, onChange: e => setMan({ ...man, prot: e.target.value }), placeholder: t.prot + " (g)",  type: "number", F }),
            h(Inp, { value: man.carb, onChange: e => setMan({ ...man, carb: e.target.value }), placeholder: t.carb + " (g)",  type: "number", F }),
            h(Inp, { value: man.fat,  onChange: e => setMan({ ...man, fat:  e.target.value }), placeholder: t.fat  + " (g)",  type: "number", F })
          ),
          h("button", {
            onClick: () => addMan(selDate),
            disabled: !man.name || !man.cal,
            style: {
              padding: "9px", fontSize: F.s, fontWeight: 500,
              border: `1px solid ${M.clay}`, borderRadius: 10,
              background: M.clay, color: "#fff", cursor: "pointer",
            },
          }, t.fadd)
        )
      )
  );
}

// ─── ScTab ────────────────────────────────────────────────────────
// Schedule tab: day-type picker + workout/active details per day.
// Props: sc, upSc, base, t, F, lang
function ScTab({ sc, upSc, base, t, F, lang }) {
  const DL  = [t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun];
  const wto = t.wtypes.map((w, i) => [WT_EN[i], w]);
  const ito = t.intens.map((v, i) => [INT_EN[i], v]);
  const wh  = lang === "zh" ? WH_ZH : WH_EN;
  const ah  = lang === "zh" ? AH_ZH : AH_EN;

  return h("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
    DAYS.map((day, di) => {
      const d   = sc[day] || { type: "rest" };
      const tgt = calcDay(base, d);
      const wt  = d.wtype || "Gym / weights";
      const ii  = Math.max(0, INT_EN.indexOf(d.inten || "Moderate"));
      const wh2 = (wh[wt] || wh["Other"])[ii];
      const ah2 = ah[ii];
      const tagBg  = TAG[d.type]?.bg  || M.light;
      const tagTxt = TAG[d.type]?.text || M.muted;

      return h(Card, { key: day },

        // Day header: label + badge + type selector
        h("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 } },
          h("span", { style: { fontSize: F.m, fontWeight: 500, minWidth: 44, color: M.text } }, DL[di]),
          h("span", { style: { padding: "3px 10px", borderRadius: 20, fontSize: F.x, fontWeight: 500, background: tagBg, color: tagTxt } },
            t.dtypes[d.type || "rest"]
          ),
          h(Sel, {
            value: d.type || "rest",
            onChange: e => upSc(day, "type", e.target.value),
            options: Object.entries(t.dtypes),
            F, style: { flex: 1, maxWidth: 160, width: "auto" },
          })
        ),

        // Workout fields
        d.type === "workout" && [
          h(Divd, { key: "div" }),
          h(Fld, { key: "wt",  label: t.wtype, F },
            h(Sel, { value: wt, onChange: e => upSc(day, "wtype", e.target.value), options: wto, F })
          ),
          h(Fld, { key: "dur", label: t.dur, F },
            h(DurInp, { value: d.dur || 60, onChange: v => upSc(day, "dur", v), F })
          ),
          h(Fld, { key: "int", label: t.inten, hint: wh2, F },
            h(Sel, { value: d.inten || "Moderate", onChange: e => upSc(day, "inten", e.target.value), options: ito, F })
          ),
          h(Fld, { key: "nt",  label: t.notes, F },
            h(Inp, { value: d.notes || "", onChange: e => upSc(day, "notes", e.target.value), placeholder: t.noteph, F })
          ),
        ],

        // Active fields
        d.type === "active" && [
          h(Divd, { key: "div" }),
          h(Fld, { key: "int", label: t.inten, hint: ah2, F },
            h(Sel, { value: d.inten || "Moderate", onChange: e => upSc(day, "inten", e.target.value), options: ito, F })
          ),
          h(Fld, { key: "nt",  label: t.notes, F },
            h(Inp, { value: d.notes || "", onChange: e => upSc(day, "notes", e.target.value), placeholder: t.noteph, F })
          ),
        ],

        // Rest fields
        d.type === "rest" && [
          h(Divd, { key: "div" }),
          h(Fld, { key: "nt", label: t.notes, F },
            h(Inp, { value: d.notes || "", onChange: e => upSc(day, "notes", e.target.value), placeholder: t.noteph, F })
          ),
        ],

        // Event fields
        d.type === "event" && [
          h(Divd, { key: "div" }),
          h(Fld, { key: "det", label: "Details", F },
            h(Inp, { value: d.detail || "", onChange: e => upSc(day, "detail", e.target.value), placeholder: t.evph, F })
          ),
          h(Fld, { key: "nt",  label: t.notes, F },
            h(Inp, { value: d.notes || "", onChange: e => upSc(day, "notes", e.target.value), placeholder: t.noteph, F })
          ),
        ],

        // Daily target summary tiles
        tgt && [
          h(Divd, { key: "div2" }),
          h("div", { key: "tiles", style: { display: "flex", gap: 8, flexWrap: "wrap" } },
            [
              { l: t.cal,  v: tgt.cal,  u: "kcal", c: MCOL.cal  },
              { l: t.prot, v: tgt.prot, u: "g",    c: MCOL.prot },
              { l: t.carb, v: tgt.carb, u: "g",    c: MCOL.carb },
              { l: t.fat,  v: tgt.fat,  u: "g",    c: MCOL.fat  },
            ].map(({ l, v, u, c }) =>
              h("div", {
                key: l,
                style: {
                  flex: 1, minWidth: 60, background: M.light, borderRadius: 10,
                  padding: "8px 10px", border: `1px solid ${M.border}`,
                  borderLeft: `3px solid ${c}`,
                },
              },
                h("div", { style: { fontSize: F.x, color: M.muted, marginBottom: 2 } }, l),
                h("div", { style: { fontSize: F.s, fontWeight: 600, color: M.text } },
                  v,
                  h("span", { style: { fontSize: F.x, fontWeight: 400, marginLeft: 1, color: M.muted } }, u)
                )
              )
            )
          ),
        ]
      );
    })
  );
}

// ─── PrTab ────────────────────────────────────────────────────────
// Profile tab: personal fields + calculated BMR/TDEE/macro targets.
// Props: pr, upPr, base, t, F, lang
function PrTab({ pr, upPr, base, t, F, lang }) {
  const flds = [
    { k: "name",         label: t.name,  type: "text",   ph: "—"  },
    { k: "age",          label: t.age,   type: "number", ph: "25" },
    { k: "weight",       label: t.wt,    type: "number", ph: "70" },
    { k: "height",       label: t.ht,    type: "number", ph: "175"},
    { k: "targetWeight", label: t.twt,   type: "number", ph: "68" },
    { k: "targetDate",   label: t.tdate, type: "date",   ph: ""   },
  ];

  return h("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },

    // Personal info card
    h(Card, null,
      h(SLbl, { label: "Personal info", F, color: M.warm }),
      h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
        flds.map(f =>
          h(Fld, { key: f.k, label: f.label, F },
            h(Inp, { value: pr[f.k] || "", onChange: e => upPr(f.k, e.target.value), placeholder: f.ph, type: f.type, F })
          )
        ),
        h(Fld, { key: "sex",  label: t.sex,  F },
          h(Sel, { value: pr.sex,  onChange: e => upPr("sex",  e.target.value), options: [["male", t.male], ["female", t.female]], F })
        ),
        h(Fld, { key: "goal", label: t.goal, F },
          h(Sel, { value: pr.goal, onChange: e => upPr("goal", e.target.value), options: [["recomp", t.recomp], ["cut", t.cut], ["bulk", t.bulk], ["maintain", t.maintain]], F })
        )
      )
    ),

    // Targets card (only when base is calculated)
    base && h(Card, null,
      h(SLbl, { label: t.dtargets, F, color: M.clay }),

      // Deadline banner
      base.dl && base.tw &&
        h("div", {
          style: {
            padding: "10px 14px", background: "#EAF0E8", borderRadius: 10,
            fontSize: F.x, color: "#5A7A58", marginBottom: 14,
            lineHeight: 1.6, border: "1px solid #C8DBC5",
          },
        }, lang === "zh"
          ? `目標：${base.dl} 天內達到 ${base.tw}kg。`
          : `Goal: reach ${base.tw}kg in ${base.dl} days.`
        ),

      // Metric tiles
      h("div", { style: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, marginBottom: 14 } },
        [
          { l: t.bmr,   v: base.bmr,   u: "kcal", c: M.dusty    },
          { l: t.tdee,  v: base.tdee,  u: "kcal", c: M.warm     },
          { l: t.cal,   v: base.cal,   u: "kcal", c: M.clay     },
          { l: t.prot,  v: base.prot,  u: "g",    c: M.lavender },
          { l: t.carb,  v: base.carbs, u: "g",    c: M.sage     },
          { l: t.fat,   v: base.fat,   u: "g",    c: M.blush    },
          { l: t.water, v: base.water, u: "ml",   c: M.mist     },
        ].map(({ l, v, u, c }) =>
          h("div", {
            key: l,
            style: { background: M.light, borderRadius: 10, padding: "10px 14px", border: `1px solid ${M.border}` },
          },
            h("div", { style: { fontSize: F.x, color: M.muted, marginBottom: 3 } }, l),
            h("div", { style: { fontSize: F.b + 2, fontWeight: 600, color: c } },
              v,
              h("span", { style: { fontSize: F.x, marginLeft: 2, fontWeight: 400, color: M.muted } }, u)
            )
          )
        )
      ),

      // BMR / TDEE explanations
      [{ title: t.bmr, text: t.bmrEx }, { title: t.tdee, text: t.tdeeEx }].map(({ title, text }) =>
        h("div", {
          key: title,
          style: { borderTop: `1px solid ${M.border}`, paddingTop: 12, marginTop: 4 },
        },
          h("div", { style: { fontSize: F.s, fontWeight: 500, marginBottom: 4, color: M.text } }, title),
          h("div", { style: { fontSize: F.x, color: M.muted, lineHeight: 1.7 } }, text)
        )
      )
    )
  );
}

// ─── Tips ─────────────────────────────────────────────────────────
// Daily Tips tab (guest view): contextual tips based on today's schedule type.
// Props: sc, t, F, lang
function Tips({ sc, t, F, lang }) {
  const tn   = DAYS[todayDowIndex()];
  const ts   = sc[tn] || { type: "rest" };
  const tt   = ts.type === "workout" ? "workout"
              : ts.type === "active" ? "active"
              : ts.type === "event"  ? "event"
              : "rest";
  const tips = lang === "zh" ? TIPS_ZH : TIPS_EN;
  const DOT_COLORS = [M.sage, M.clay, M.lavender, M.blush];

  return h("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
    h("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
      h("span", { style: { fontSize: F.m, fontWeight: 500, color: M.text } }, t.tsched + ":"),
      h("span", {
        style: {
          padding: "3px 12px", borderRadius: 20, fontSize: F.x, fontWeight: 500,
          background: TAG[ts.type]?.bg || M.light,
          color: TAG[ts.type]?.text || M.muted,
        },
      }, t.dtypes[ts.type])
    ),
    (tips[tt] || tips.rest).map((tip, i) =>
      h(Card, { key: i },
        h("div", { style: { display: "flex", gap: 12, alignItems: "flex-start" } },
          h("div", {
            style: {
              width: 8, height: 8, borderRadius: "50%",
              background: DOT_COLORS[i % 4],
              marginTop: 5, flexShrink: 0,
            },
          }),
          h("p", { style: { fontSize: F.s, lineHeight: 1.75, margin: 0, color: M.text } }, tip)
        )
      )
    )
  );
}

// ─── App ──────────────────────────────────────────────────────────
// Root component: auth gate, persistent storage, top nav, tab routing.
function App() {
  const [lang,      setLang]      = useState("en");
  const [fs,        setFs]        = useState("sm");
  const [auth,      setAuth]      = useState(null);   // null | "owner" | "guest"
  const [tab,       setTab]       = useState("Dashboard");
  const [showPr,    setShowPr]    = useState(false);
  const [pr,        setPr]        = useState({ name: "", sex: "male", age: "", weight: "", height: "", goal: "recomp", targetWeight: "", targetDate: "" });
  const [sc,        setSc]        = useState(DSCHED);
  const [logs,      setLogs]      = useState({});
  const [wlog,      setWlog]      = useState({});
  const [loaded,    setLoaded]    = useState(false);
  const [saveStatus,setSaveStatus]= useState("");
  const [importMsg, setImportMsg] = useState("");
  const importRef = useRef();

  const t       = T[lang];
  const F       = FSZ[fs];
  const base    = calcBase(pr, sc);
  const isOwner = auth === "owner";
  const TABS    = ["Dashboard", "Log Food", "Schedule", isOwner ? "AI Coach" : "Daily Tips"];

  // Load persisted state on mount
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r) {
          const d = JSON.parse(r.value);
          if (d.pr)   setPr(d.pr);
          if (d.sc)   setSc({ ...DSCHED, ...d.sc });
          if (d.logs) setLogs(d.logs);
          if (d.wlog) setWlog(d.wlog);
          if (d.lang) setLang(d.lang);
          if (d.fs)   setFs(d.fs);
        }
      } catch (e) { /* first run — nothing to restore */ }
      setLoaded(true);
    })();
  }, []);

  async function save(p, s, l, w, lg, f) {
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify({ pr: p, sc: s, logs: l, wlog: w, lang: lg, fs: f }));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      setSaveStatus("err");
    }
  }

  const upPr  = (k, v) => { const p = { ...pr,  [k]: v };              setPr(p);  save(p, sc, logs, wlog, lang, fs); };
  const upSc  = (day, k, v) => { const s = { ...sc, [day]: { ...sc[day], [k]: v } }; setSc(s);  save(pr, s, logs, wlog, lang, fs); };
  const upLog = (dkey, upd) => { const l = { ...logs, [dkey]: upd(logs[dkey] || ed()) }; setLogs(l); save(pr, sc, l, wlog, lang, fs); };
  const upW   = (dkey, val) => { const w = { ...wlog, [dkey]: parseFloat(val) };      setWlog(w); save(pr, sc, logs, w, lang, fs); };
  const swLang = l => { setLang(l); save(pr, sc, logs, wlog, l, fs); };
  const swFs   = f => { setFs(f);   save(pr, sc, logs, wlog, lang, f); };

  // Export data as JSON download
  function doExport() {
    const blob = new Blob([JSON.stringify({ pr, sc, logs, wlog, lang, fs }, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `nutrition_backup_${dk(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import data from JSON file
  function doImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.pr)   setPr(d.pr);
        if (d.sc)   setSc({ ...DSCHED, ...d.sc });
        if (d.logs) setLogs(d.logs);
        if (d.wlog) setWlog(d.wlog);
        if (d.lang) setLang(d.lang);
        if (d.fs)   setFs(d.fs);
        save(d.pr || pr, d.sc || sc, d.logs || logs, d.wlog || wlog, d.lang || lang, d.fs || fs);
        setImportMsg("✓");
        setTimeout(() => setImportMsg(""), 2500);
      } catch (err) {
        setImportMsg("⚠ Invalid file");
        setTimeout(() => setImportMsg(""), 2500);
      }
    };
    r.readAsText(file);
    e.target.value = "";
  }

  if (!loaded) return h("div", { style: { padding: "2rem", color: M.muted } }, "Loading…");

  // ── Passcode gate ─────────────────────────────────────────────────
  if (!auth) return h("div", {
    style: {
      fontFamily: "system-ui,-apple-system,sans-serif",
      maxWidth: 480, margin: "0 auto", padding: "1rem", fontSize: F.b,
    },
  },
    h("div", { style: { display: "flex", justifyContent: "flex-end", padding: "0.5rem 0 1rem" } },
      h(Seg, { opts: ["en", "zh"], labs: ["EN", "中"], val: lang, onChange: swLang, F })
    ),
    h(PcScreen, { onUnlock: () => setAuth("owner"), onGuest: () => setAuth("guest"), t, F })
  );

  return h("div", {
    style: {
      fontFamily: "system-ui,-apple-system,sans-serif",
      maxWidth: 720, margin: "0 auto", background: M.bg,
      minHeight: "100vh", paddingBottom: "3rem", fontSize: F.b,
    },
  },

    // ── Export/import banner ──────────────────────────────────────
    h("div", {
      style: {
        background: "#EAF0E8", borderBottom: "1px solid #C8DBC5",
        padding: "8px 1.25rem", display: "flex",
        alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 8,
      },
    },
      h("span", { style: { fontSize: 11, color: "#5A7A58", display: "flex", alignItems: "center", gap: 6 } },
        h("span", null, "💾"),
        h("span", null, lang === "zh"
          ? "關閉前請匯出資料以儲存進度，重新開啟時匯入即可恢復。"
          : "Export your data before closing to save progress. Import it next time to restore."
        )
      ),
      h("div", { style: { display: "flex", gap: 6, alignItems: "center" } },
        importMsg && h("span", {
          style: {
            fontSize: 11, fontWeight: 500,
            color: importMsg.startsWith("⚠") ? "#C4786A" : "#5A7A58",
          },
        }, importMsg),
        h("button", {
          onClick: doExport,
          style: {
            padding: "4px 12px", fontSize: 11, fontWeight: 500,
            border: "1px solid #5A7A58", borderRadius: 20,
            background: "#5A7A58", color: "#fff", cursor: "pointer", whiteSpace: "nowrap",
          },
        }, lang === "zh" ? "📥 匯出" : "📥 Export"),
        h("button", {
          onClick: () => importRef.current.click(),
          style: {
            padding: "4px 12px", fontSize: 11, fontWeight: 500,
            border: "1px solid #5A7A58", borderRadius: 20,
            background: "transparent", color: "#5A7A58", cursor: "pointer", whiteSpace: "nowrap",
          },
        }, lang === "zh" ? "📤 匯入" : "📤 Import"),
        h("input", { ref: importRef, type: "file", accept: ".json", style: { display: "none" }, onChange: doImport })
      )
    ),

    // ── Sticky top nav ────────────────────────────────────────────
    h("div", {
      style: {
        background: M.card, borderBottom: `1px solid ${M.border}`,
        padding: "0.875rem 1.25rem", position: "sticky", top: 0, zIndex: 10,
      },
    },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 } },

        // Tab buttons
        h("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } },
          TABS.map((k, i) => {
            const active = tab === k && !showPr;
            return h("button", {
              key: k,
              onClick: () => { setTab(k); setShowPr(false); },
              style: {
                padding: "6px 14px", fontSize: F.m,
                border: `1px solid ${active ? M.sage : M.border}`,
                borderRadius: 20,
                background: active ? M.sage : "transparent",
                color: active ? "#fff" : M.muted,
                cursor: "pointer", whiteSpace: "nowrap",
                fontWeight: active ? 500 : 400,
              },
            }, t.tabs[i]);
          })
        ),

        // Controls: save status, size, lang, profile
        h("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
          saveStatus && h("span", {
            style: {
              fontSize: F.x, padding: "3px 10px",
              border: `1px solid ${saveStatus === "saved" ? M.sage : "#C4786A"}`,
              borderRadius: 20, background: M.light,
              color: saveStatus === "saved" ? M.sage : "#C4786A",
            },
          }, saveStatus === "saved" ? "✓ Saved" : "⚠ Err"),
          !isOwner && h("span", {
            style: {
              fontSize: F.x, color: M.muted, padding: "3px 10px",
              border: `1px solid ${M.border}`, borderRadius: 20, background: M.light,
            },
          }, t.guest),
          h(Seg, { opts: ["sm", "md", "lg"], labs: ["S", "M", "L"], val: fs, onChange: swFs, F }),
          h(Seg, { opts: ["en", "zh"], labs: ["EN", "中"], val: lang, onChange: swLang, F }),
          h("button", {
            onClick: () => setShowPr(!showPr),
            style: {
              padding: "6px 14px", fontSize: F.m,
              border: `1px solid ${showPr ? M.clay : M.border}`,
              borderRadius: 20,
              background: showPr ? M.clay : "transparent",
              color: showPr ? "#fff" : M.muted,
              cursor: "pointer", fontWeight: showPr ? 500 : 400,
            },
          }, t.pnav)
        )
      )
    ),

    // ── Page body ─────────────────────────────────────────────────
    h("div", { style: { padding: "1.25rem" } },
      showPr                            && h(PrTab,       { pr, upPr, base, t, F, lang }),
      !showPr && tab === "Dashboard"    && h(Dash,        { base, logs, wlog, upW, sc, t, F }),
      !showPr && tab === "Log Food"     && isOwner        && h(OwnerLogFood, { logs, upLog, base, sc, t, F, lang }),
      !showPr && tab === "Log Food"     && !isOwner       && h(LogFood,      { logs, upLog, base, sc, t, F, lang }),
      !showPr && tab === "Schedule"     && h(ScTab,       { sc, upSc, base, t, F, lang }),
      !showPr && tab === "AI Coach"     && h(Tips,        { sc, t, F, lang }),
      !showPr && tab === "Daily Tips"   && h(Tips,        { sc, t, F, lang })
    )
  );
}

// ── Mount ─────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById("root")).render(h(App));
