// ─── server.js ────────────────────────────────────────────────────
// Render proxy server for NourishLog AI food analysis.
// Receives meal description / image from the browser,
// calls the Anthropic API (key stored safely here),
// and returns a JSON array of food items with macros.

const express = require("express");
const cors    = require("cors");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors({
  origin: [
    /\.github\.io$/,          // any GitHub Pages domain
    "http://localhost:5500",  // Live Server for local testing
    "http://localhost:3000",
  ],
}));
app.use(express.json({ limit: "10mb" }));  // 10mb to allow photo uploads

// ── Health check ───────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "NourishLog API" });
});

// ── POST /api/analyze ──────────────────────────────────────────────
// Body: { description?: string, imageData?: string, imageType?: string }
// Returns: [{ name, cal, prot, carb, fat }, ...]
app.post("/api/analyze", async (req, res) => {
  const { description, imageData, imageType } = req.body;

  if (!description && !imageData) {
    return res.status(400).json({ error: "Provide a description or an image." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured on server." });
  }

  // Build the content array for Claude
  const content = [];

  if (imageData && imageType) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: imageType, data: imageData },
    });
  }

  const prompt = [
    "Return ONLY a JSON array — no markdown, no explanation.",
    "Each element: { \"name\": string, \"cal\": number, \"prot\": number, \"carb\": number, \"fat\": number }",
    "Use realistic portion sizes.",
    description ? `Food description: ${description}` : "Identify all food items in the image.",
  ].join("\n");

  content.push({ type: "text", text: prompt });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":         "application/json",
        "x-api-key":            apiKey,
        "anthropic-version":    "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages:   [{ role: "user", content }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(502).json({ error: data.error.message });
    }

    // Extract text and parse JSON array
    const raw   = data.content.map(c => c.text || "").join("").trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    const items = JSON.parse(clean);

    return res.json(items);

  } catch (err) {
    console.error("Analyze error:", err.message);
    return res.status(500).json({ error: "Failed to analyze food: " + err.message });
  }
});

// ── Start ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`NourishLog API running on port ${PORT}`);
});
