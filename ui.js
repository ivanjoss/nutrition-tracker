// ─── ui.js ────────────────────────────────────────────────────────
// Shared primitive React components used throughout the app.
// All JSX has been converted to React.createElement() calls.
// Depends on: data.js (M, MCOL must be in scope), React (global)

// ─── h helper ────────────────────────────────────────────────────
// Shorthand so the file stays readable without JSX.
// h(type, props, ...children) === React.createElement(type, props, ...children)
const h = React.createElement;

// ─── Seg ─────────────────────────────────────────────────────────
// Segmented control (pill-shaped toggle button group).
// Props: opts[]  — option values
//        labs[]  — display labels (parallel to opts)
//        val     — currently selected value
//        onChange(value) — callback
//        F       — font-size scale object
const Seg = ({ opts, labs, val, onChange, F }) =>
  h("div",
    {
      style: {
        display: "flex",
        border: `1px solid ${M.border}`,
        borderRadius: 20,
        overflow: "hidden",
        background: M.light,
      },
    },
    opts.map((o, i) =>
      h("button",
        {
          key: o,
          onClick: () => onChange(o),
          style: {
            padding: "5px 12px",
            fontSize: F.x,
            border: "none",
            borderRight: i < opts.length - 1 ? `1px solid ${M.border}` : "none",
            background: val === o ? M.card : "transparent",
            color: val === o ? M.text : M.muted,
            cursor: "pointer",
            fontWeight: val === o ? 500 : 400,
          },
        },
        labs[i]
      )
    )
  );

// ─── Card ─────────────────────────────────────────────────────────
// Standard content card with border, shadow, and rounded corners.
// Accepts an optional `style` override spread on top of the defaults.
const Card = ({ children, style = {} }) =>
  h("div",
    {
      style: {
        background: M.card,
        border: `1px solid ${M.border}`,
        borderRadius: 14,
        padding: "1rem 1.25rem",
        boxShadow: "0 1px 4px rgba(74,69,64,0.06)",
        ...style,
      },
    },
    children
  );

// ─── Divd ─────────────────────────────────────────────────────────
// Thin horizontal divider line.
const Divd = () =>
  h("div", {
    style: { height: "1px", background: M.border, margin: "14px 0" },
  });

// ─── SLbl ─────────────────────────────────────────────────────────
// Section label: small-caps text with a coloured left accent bar.
// Props: label — text content
//        F     — font-size scale
//        color — optional accent colour (defaults to M.muted / M.dusty)
const SLbl = ({ label, F, color }) =>
  h("div",
    {
      style: {
        fontSize: F.x,
        fontWeight: 600,
        color: color || M.muted,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 10,
        display: "flex",
        alignItems: "center",
        gap: 6,
      },
    },
    h("div", {
      style: {
        width: 3,
        height: 12,
        borderRadius: 2,
        background: color || M.dusty,
        flexShrink: 0,
      },
    }),
    label
  );

// ─── Fld ──────────────────────────────────────────────────────────
// Form field wrapper: label above, optional italic hint below.
// Props: label    — field label text
//        hint     — optional hint / explanation string
//        children — the actual input element
//        F        — font-size scale
const Fld = ({ label, hint, children, F }) =>
  h("div",
    { style: { marginBottom: 12 } },
    h("label",
      {
        style: {
          fontSize: F.x,
          color: M.muted,
          display: "block",
          marginBottom: 5,
          fontWeight: 500,
        },
      },
      label
    ),
    children,
    hint &&
      h("div",
        {
          style: {
            fontSize: F.x,
            color: M.dusty,
            marginTop: 4,
            lineHeight: 1.5,
            fontStyle: "italic",
          },
        },
        hint
      )
  );

// ─── Inp ──────────────────────────────────────────────────────────
// Styled text/number/date input. Highlights border on focus.
// Props: value, onChange, placeholder, type ("text"), F, style ({})
const Inp = ({ value, onChange, placeholder, type = "text", F, style = {} }) =>
  h("input", {
    type,
    value,
    onChange,
    placeholder,
    style: {
      width: "100%",
      padding: "10px 14px",
      fontSize: F.s,
      border: `1px solid ${M.border}`,
      borderRadius: 10,
      background: M.card,
      color: M.text,
      boxSizing: "border-box",
      outline: "none",
      ...style,
    },
    onFocus: e => { e.target.style.borderColor = M.dusty; },
    onBlur:  e => { e.target.style.borderColor = M.border; },
  });

// ─── Sel ──────────────────────────────────────────────────────────
// Styled <select> dropdown.
// Props: value, onChange, options ([[value, label], …]), F, style ({})
const Sel = ({ value, onChange, options, F, style = {} }) =>
  h("select",
    {
      value,
      onChange,
      style: {
        width: "100%",
        padding: "10px 14px",
        fontSize: F.s,
        border: `1px solid ${M.border}`,
        borderRadius: 10,
        background: M.card,
        color: M.text,
        outline: "none",
        ...style,
      },
    },
    options.map(([v, l]) =>
      h("option", { key: v, value: v }, l)
    )
  );

// ─── MPill ────────────────────────────────────────────────────────
// Macro progress bar: label + "val/max" fraction above a filled track.
// Turns red when the value exceeds the target.
// Props: label, val, max, color, unit (""), F
const MPill = ({ label, val, max, color, unit = "", F }) => {
  const pct  = Math.min(100, max > 0 ? Math.round((val / max) * 100) : 0);
  const over = val > max && max > 0;

  return h("div",
    { style: { flex: 1, minWidth: 0 } },

    // Value / target row
    h("div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          fontSize: F.x,
          marginBottom: 4,
        },
      },
      h("span", { style: { color: M.muted } }, label),
      h("span",
        { style: { color: over ? "#C4786A" : M.text, fontWeight: 500 } },
        val, unit,
        h("span",
          { style: { fontWeight: 400, color: M.dusty } },
          "/", max, unit
        )
      )
    ),

    // Progress track
    h("div",
      {
        style: {
          height: 6,
          background: M.light,
          borderRadius: 4,
          overflow: "hidden",
          border: `1px solid ${M.border}`,
        },
      },
      h("div", {
        style: {
          height: "100%",
          width: `${pct}%`,
          background: over ? "#C4A09A" : color,
          borderRadius: 4,
          transition: "width 0.4s",
        },
      })
    )
  );
};

// ─── DurInp ───────────────────────────────────────────────────────
// Duration input: a range slider synced with a number input, plus a
// plain-text readout beneath. Range: 15–180 min, step 5.
// Props: value, onChange(stringValue), F
const DurInp = ({ value, onChange, F }) => {
  const v = parseInt(value) || 60;

  return h("div", null,
    h("div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 4,
        },
      },
      // Slider
      h("input", {
        type: "range",
        min: 15,
        max: 180,
        step: 5,
        value: v,
        onChange: e => onChange(e.target.value),
        style: { flex: 1, accentColor: M.sage },
      }),
      // Number box
      h("input", {
        type: "number",
        min: 15,
        max: 180,
        value: v,
        onChange: e => onChange(e.target.value),
        style: {
          width: 62,
          padding: "7px 8px",
          fontSize: F.s,
          border: `1px solid ${M.border}`,
          borderRadius: 10,
          background: M.card,
          color: M.text,
          textAlign: "center",
          outline: "none",
        },
      })
    ),
    // Readout
    h("div",
      { style: { fontSize: F.x, color: M.muted } },
      v, " min"
    )
  );
};
