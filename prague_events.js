const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_PRAGUE_EVENTS;

function isFriday() {
  const now = new Date(Date.now() + 2 * 60 * 60 * 1000); // CEST UTC+2
  return now.getUTCDay() === 5;
}

function getDateContext() {
  const now = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const days = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];
  const months = ["ledna", "února", "března", "dubna", "května", "června",
                  "července", "srpna", "září", "října", "listopadu", "prosince"];
  const today = `${days[now.getUTCDay()]} ${now.getUTCDate()}. ${months[now.getUTCMonth()]} ${now.getUTCFullYear()}`;

  if (isFriday()) {
    const sat = new Date(now); sat.setUTCDate(now.getUTCDate() + 1);
    const sun = new Date(now); sun.setUTCDate(now.getUTCDate() + 2);
    const period = `${sat.getUTCDate()}. – ${sun.getUTCDate()}. ${months[sun.getUTCMonth()]}`;
    return { today, period };
  }
  return { today, period: `${now.getUTCDate()}. ${months[now.getUTCMonth()]}` };
}

function buildPrompt(today, period) {
  if (isFriday()) {
    return `Dnes je ${today}. Sestavíš mi přehled zajímavých akcí v Praze a okolí na víkend ${period}.

Hledej různorodý mix: farmářské trhy, výstavy, koncerty, komentované prohlídky, sportovní akce, festivaly, Zoo Praha speciální programy, venkovní kina, workshopy, pop-up akce, bleší trhy atd.

Najdi 8–10 akcí. Pro každou uveď název, stručný popis (1 věta), místo konání, datum a čas, cenu vstupného.
Seřaď akce od nejlevnější (zdarma první).

Odpověz POUZE validním JSON polem, bez markdown, bez preamble:
[
  {
    "nazev": "...",
    "popis": "...",
    "misto": "...",
    "cas": "...",
    "cena": 0,
    "cena_text": "zdarma",
    "odkaz": "..."
  }
]
Kde "cena" je číslo v Kč (0 pro zdarma, -1 pokud neznáš).`;
  } else {
    return `Dnes je ${today}. Hledej výjimečné nebo časově omezené akce v Praze na dnešní den — věci, které by bylo škoda minout: unikátní pop-up akce, poslední dny výstavy, jednodenní festival, speciální program v Zoo, mimořádný trh apod.

Pokud ŽÁDNÁ taková výjimečná akce neexistuje, vrať prázdné pole: []

Pokud výjimečná akce existuje, vrať maximálně 3 akce jako JSON pole:
[
  {
    "nazev": "...",
    "popis": "...",
    "misto": "...",
    "cas": "...",
    "cena": 0,
    "cena_text": "zdarma",
    "odkaz": "..."
  }
]
Kde "cena" je číslo v Kč (0 pro zdarma, -1 pokud neznáš). Odpověz POUZE validním JSON, bez markdown.`;
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

function priceEmoji(cena) {
  if (cena === 0) return "🟢";
  if (cena <= 200) return "🟡";
  if (cena <= 500) return "🟠";
  if (cena > 500) return "🔴";
  return "⚪";
}

function formatEvent(event) {
  const emoji = priceEmoji(event.cena ?? -1);
  let line = `${emoji} **${event.nazev}**`;
  if (event.popis) line += `\n↳ ${event.popis}`;

  const details = [];
  if (event.misto) details.push(`📍 ${event.misto}`);
  if (event.cas) details.push(`🕐 ${event.cas}`);
  if (event.cena_text) details.push(`💸 ${event.cena_text}`);
  if (details.length) line += "\n" + details.join("  ·  ");
  if (event.odkaz && event.odkaz !== "neznámý") line += `\n🔗 ${event.odkaz}`;

  return line;
}

function buildDiscordMessage(events, period) {
  const header = isFriday()
    ? `🗓️ **Praha tento víkend** — ${period}\n─────────────────────────\n`
    : `✨ **Tip na dnešní den v Praze**\n─────────────────────────\n`;

  const legend = "🟢 zdarma  🟡 do 200 Kč  🟠 do 500 Kč  🔴 500 Kč+";
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
  console.log(`Dnes: ${today}, pátek: ${isFriday()}`);

  const prompt = buildPrompt(today, period);
  const raw = await callOpenAI(prompt);
  console.log(`GPT response:\n${raw}`);

  const events = parseEvents(raw);
  console.log(`Nalezeno akcí: ${events.length}`);

  if (!events.length) {
    console.log("Žádné výjimečné akce dnes, nepřeposílám.");
    return;
  }

  const message = buildDiscordMessage(events, period);
  console.log(`Discord zpráva:\n${message}`);
  await sendDiscord(message);
  console.log("Hotovo!");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
