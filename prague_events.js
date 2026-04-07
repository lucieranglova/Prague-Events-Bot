const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_PRAGUE_EVENTS;
const LANG = (process.env.LANG || "en").toLowerCase(); // "en" or "cs"

// ── Translations ─────────────────────────────────────────────────────────────

const T = {
  en: {
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    months: ["January", "February", "March", "April", "May", "June",
             "July", "August", "September", "October", "November", "December"],
    periodFormat: (sat, sun, month) => `${sat}–${sun} ${month}`,
    headerWeekend: (period) => `🗓️ **Prague this weekend** — ${period}\n─────────────────────────\n`,
    headerToday: `✨ **Prague tip for today**\n─────────────────────────\n`,
    legend: "🟢 free  🟡 up to 200 CZK  🟠 up to 500 CZK  🔴 500 CZK+",
    promptWeekend: (today, period) =>
      `Today is ${today}. Find a list of interesting events in Prague and the surrounding area for the weekend of ${period}.

Look for a varied mix: farmers markets, exhibitions, concerts, guided tours, sports events, festivals, Prague Zoo special programmes, outdoor cinemas, workshops, pop-up events, flea markets, etc.

Find 8–10 events. For each one include: name, short description (1 sentence), venue, date and time, entry price.
Sort events from cheapest first (free events at the top).

Reply with ONLY a valid JSON array, no markdown, no preamble:
[
  {
    "name": "...",
    "description": "...",
    "venue": "...",
    "time": "...",
    "price": 0,
    "price_text": "free",
    "link": "..."
  }
]
Where "price" is a number in CZK (0 for free, -1 if unknown).`,
    promptToday: (today) =>
      `Today is ${today}. Search for exceptional or time-limited events in Prague for today — things that would be a shame to miss: unique pop-up events, last days of an exhibition, a one-day festival, a special Prague Zoo programme, an unusual market, etc.

If NO such exceptional event exists, return an empty array: []

If exceptional events exist, return up to 3 as a JSON array:
[
  {
    "name": "...",
    "description": "...",
    "venue": "...",
    "time": "...",
    "price": 0,
    "price_text": "free",
    "link": "..."
  }
]
Where "price" is a number in CZK (0 for free, -1 if unknown). Reply with ONLY valid JSON, no markdown.`,
    noEvents: "No exceptional events today, skipping Discord message.",
    logToday: (today, fri) => `Today: ${today}, Friday: ${fri}`,
    logFound: (n) => `Events found: ${n}`,
    logDone: "Done!",
    fields: { name: "name", description: "description", venue: "venue", time: "time", price: "price", price_text: "price_text", link: "link" },
    unknownLink: "unknown",
  },
  cs: {
    days: ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"],
    months: ["ledna", "února", "března", "dubna", "května", "června",
             "července", "srpna", "září", "října", "listopadu", "prosince"],
    periodFormat: (sat, sun, month) => `${sat}. – ${sun}. ${month}`,
    headerWeekend: (period) => `🗓️ **Praha tento víkend** — ${period}\n─────────────────────────\n`,
    headerToday: `✨ **Tip na dnešní den v Praze**\n─────────────────────────\n`,
    legend: "🟢 zdarma  🟡 do 200 Kč  🟠 do 500 Kč  🔴 500 Kč+",
    promptWeekend: (today, period) =>
      `Dnes je ${today}. Sestavíš mi přehled zajímavých akcí v Praze a okolí na víkend ${period}.

Hledej různorodý mix: farmářské trhy, výstavy, koncerty, komentované prohlídky, sportovní akce, festivaly, Zoo Praha speciální programy, venkovní kina, workshopy, pop-up akce, bleší trhy atd.

Najdi 8–10 akcí. Pro každou uveď název, stručný popis (1 věta), místo konání, datum a čas, cenu vstupného.
Seřaď akce od nejlevnější (zdarma první).

Odpověz POUZE validním JSON polem, bez markdown, bez preamble:
[
  {
    "name": "...",
    "description": "...",
    "venue": "...",
    "time": "...",
    "price": 0,
    "price_text": "zdarma",
    "link": "..."
  }
]
Kde "price" je číslo v Kč (0 pro zdarma, -1 pokud neznáš).`,
    promptToday: (today) =>
      `Dnes je ${today}. Hledej výjimečné nebo časově omezené akce v Praze na dnešní den — věci, které by bylo škoda minout: unikátní pop-up akce, poslední dny výstavy, jednodenní festival, speciální program v Zoo, mimořádný trh apod.

Pokud ŽÁDNÁ taková výjimečná akce neexistuje, vrať prázdné pole: []

Pokud výjimečná akce existuje, vrať maximálně 3 akce jako JSON pole:
[
  {
    "name": "...",
    "description": "...",
    "venue": "...",
    "time": "...",
    "price": 0,
    "price_text": "zdarma",
    "link": "..."
  }
]
Kde "price" je číslo v Kč (0 pro zdarma, -1 pokud neznáš). Odpověz POUZE validním JSON, bez markdown.`,
    noEvents: "Žádné výjimečné akce dnes, nepřeposílám.",
    logToday: (today, fri) => `Dnes: ${today}, pátek: ${fri}`,
    logFound: (n) => `Nalezeno akcí: ${n}`,
    logDone: "Hotovo!",
    fields: { name: "name", description: "description", venue: "venue", time: "time", price: "price", price_text: "price_text", link: "link" },
    unknownLink: "neznámý",
  }
};

const t = T[LANG] || T.en;

// ── Date helpers ──────────────────────────────────────────────────────────────

function isFriday() {
  const now = new Date(Date.now() + 2 * 60 * 60 * 1000); // CEST UTC+2
  return now.getUTCDay() === 5;
}

function getDateContext() {
  const now = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const today = `${t.days[now.getUTCDay()]} ${now.getUTCDate()} ${t.months[now.getUTCMonth()]} ${now.getUTCFullYear()}`;

  if (isFriday()) {
    const sat = new Date(now); sat.setUTCDate(now.getUTCDate() + 1);
    const sun = new Date(now); sun.setUTCDate(now.getUTCDate() + 2);
    const period = t.periodFormat(sat.getUTCDate(), sun.getUTCDate(), t.months[sun.getUTCMonth()]);
    return { today, period };
  }
  return { today, period: `${now.getUTCDate()} ${t.months[now.getUTCMonth()]}` };
}

// ── OpenAI ────────────────────────────────────────────────────────────────────

function buildPrompt(today, period) {
  return isFriday() ? t.promptWeekend(today, period) : t.promptToday(today);
}

async function callOpenAI(prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-search-preview",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000
    })
  });
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

function parseEvents(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/```json|```/g, "").trim();
  }
  return JSON.parse(cleaned);
}

// ── Formatting ────────────────────────────────────────────────────────────────

function priceEmoji(price) {
  if (price === 0) return "🟢";
  if (price <= 200) return "🟡";
  if (price <= 500) return "🟠";
  if (price > 500) return "🔴";
  return "⚪";
}

function formatEvent(event) {
  const f = t.fields;
  const emoji = priceEmoji(event[f.price] ?? -1);
  let line = `${emoji} **${event[f.name]}**`;
  if (event[f.description]) line += `\n↳ ${event[f.description]}`;

  const details = [];
  if (event[f.venue]) details.push(`📍 ${event[f.venue]}`);
  if (event[f.time]) details.push(`🕐 ${event[f.time]}`);
  if (event[f.price_text]) details.push(`💸 ${event[f.price_text]}`);
  if (details.length) line += "\n" + details.join("  ·  ");
  if (event[f.link] && event[f.link] !== t.unknownLink) line += `\n🔗 ${event[f.link]}`;

  return line;
}

function buildDiscordMessage(events, period) {
  const header = isFriday() ? t.headerWeekend(period) : t.headerToday;
  const blocks = events.map(formatEvent).join("\n\n");
  let message = header + blocks + `\n\n${t.legend}`;
  if (message.length > 1990) message = message.slice(0, 1987) + "...";
  return message;
}

// ── Discord ───────────────────────────────────────────────────────────────────

async function sendDiscord(message) {
  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message })
  });
  console.log(`Discord response: ${res.status}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { today, period } = getDateContext();
  console.log(t.logToday(today, isFriday()));

  const prompt = buildPrompt(today, period);
  const raw = await callOpenAI(prompt);
  console.log(`GPT response:\n${raw}`);

  const events = parseEvents(raw);
  console.log(t.logFound(events.length));

  if (!events.length) {
    console.log(t.noEvents);
    return;
  }

  const message = buildDiscordMessage(events, period);
  console.log(`Discord message:\n${message}`);
  await sendDiscord(message);
  console.log(t.logDone);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
