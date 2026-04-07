const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_PRAGUE_EVENTS;

function isFriday() {
  const now = new Date(Date.now() + 2 * 60 * 60 * 1000); // CEST UTC+2
  return now.getUTCDay() === 5;
}

function getDateContext() {
  const now = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];
  const today = `${days[now.getUTCDay()]} ${now.getUTCDate()} ${months[now.getUTCMonth()]} ${now.getUTCFullYear()}`;

  if (isFriday()) {
    const sat = new Date(now); sat.setUTCDate(now.getUTCDate() + 1);
    const sun = new Date(now); sun.setUTCDate(now.getUTCDate() + 2);
    const period = `${sat.getUTCDate()}–${sun.getUTCDate()} ${months[sun.getUTCMonth()]}`;
    return { today, period };
  }
  return { today, period: `${now.getUTCDate()} ${months[now.getUTCMonth()]}` };
}

function buildPrompt(today, period) {
  if (isFriday()) {
    return `Today is ${today}. Find a list of interesting events in Prague and the surrounding area for the weekend of ${period}.

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
Where "price" is a number in CZK (0 for free, -1 if unknown).`;
  } else {
    return `Today is ${today}. Search for exceptional or time-limited events in Prague for today — things that would be a shame to miss: unique pop-up events, last days of an exhibition, a one-day festival, a special Prague Zoo programme, an unusual market, etc.

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
Where "price" is a number in CZK (0 for free, -1 if unknown). Reply with ONLY valid JSON, no markdown.`;
  }
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

function priceEmoji(price) {
  if (price === 0) return "🟢";
  if (price <= 200) return "🟡";
  if (price <= 500) return "🟠";
  if (price > 500) return "🔴";
  return "⚪";
}

function formatEvent(event) {
  const emoji = priceEmoji(event.price ?? -1);
  let line = `${emoji} **${event.name}**`;
  if (event.description) line += `\n↳ ${event.description}`;

  const details = [];
  if (event.venue) details.push(`📍 ${event.venue}`);
  if (event.time) details.push(`🕐 ${event.time}`);
  if (event.price_text) details.push(`💸 ${event.price_text}`);
  if (details.length) line += "\n" + details.join("  ·  ");
  if (event.link && event.link !== "unknown") line += `\n🔗 ${event.link}`;

  return line;
}

function buildDiscordMessage(events, period) {
  const header = isFriday()
    ? `🗓️ **Prague this weekend** — ${period}\n─────────────────────────\n`
    : `✨ **Prague tip for today**\n─────────────────────────\n`;

  const legend = "🟢 free  🟡 up to 200 CZK  🟠 up to 500 CZK  🔴 500 CZK+";
  const blocks = events.map(formatEvent).join("\n\n");
  let message = header + blocks + `\n\n${legend}`;

  if (message.length > 1990) message = message.slice(0, 1987) + "...";
  return message;
}

async function sendDiscord(message) {
  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message })
  });
  console.log(`Discord response: ${res.status}`);
}

async function main() {
  const { today, period } = getDateContext();
  console.log(`Today: ${today}, Friday: ${isFriday()}`);

  const prompt = buildPrompt(today, period);
  const raw = await callOpenAI(prompt);
  console.log(`GPT response:\n${raw}`);

  const events = parseEvents(raw);
  console.log(`Events found: ${events.length}`);

  if (!events.length) {
    console.log("No exceptional events today, skipping Discord message.");
    return;
  }

  const message = buildDiscordMessage(events, period);
  console.log(`Discord message:\n${message}`);
  await sendDiscord(message);
  console.log("Done!");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
