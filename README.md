# 🗓️ Prague Events Bot

A Discord bot that searches for interesting events in Prague and the surrounding area every morning and posts them to Discord. On Fridays it sends a full weekend digest — on other days it only posts if something exceptional is on.

Supports **English** and **Czech** — choose your language by selecting the matching workflow.

---

## How it works

The bot runs every day at 6:00 AM (CEST) via GitHub Actions. It uses GPT-4o-mini with web search enabled to find current events — farmers markets, exhibitions, concerts, Prague Zoo special programmes, festivals, and more.

**Friday** → sends 8–10 events for the whole weekend, sorted from cheapest first  
**Other days** → sends up to 3 tips, only if something exceptional is happening. Otherwise stays silent.

### Price categories

| Emoji | Price |
|-------|-------|
| 🟢 | Free |
| 🟡 | Up to 200 CZK |
| 🟠 | Up to 500 CZK |
| 🔴 | 500 CZK and above |
| ⚪ | Price unknown |

### Example output

```
🗓️ Prague this weekend — 12–13 April
─────────────────────────
🟢 Jiřák Farmers Market
↳ Prague's largest farmers market with fresh produce from local growers.
📍 nám. Jiřího z Poděbrad  ·  🕐 Sat 8:00–13:00  ·  💸 free

🟡 Prague Zoo — penguin feeding with commentary
↳ Special weekend programme for the whole family.
📍 Prague Zoo, Troja  ·  🕐 Sat & Sun 14:00  ·  💸 180 CZK (zoo entry)

🟢 free  🟡 up to 200 CZK  🟠 up to 500 CZK  🔴 500 CZK+
```

---

## Files

```
prague_events.js              # main script (bilingual)
.github/workflows/
  prague_events_en.yml        # English workflow
  prague_events_cs.yml        # Czech workflow
```

---

## Setup

### 1. Fork or clone the repository

### 2. Create a Discord webhook

In your Discord server → Channel Settings → Integrations → Webhooks → New Webhook. Copy the URL.

### 3. Add Secrets

In the repository: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Description |
|--------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `DISCORD_WEBHOOK_PRAGUE_EVENTS` | Your Discord webhook URL |

### 4. Choose your language

Both workflows share the same script — the language is controlled by the `LANG` variable set inside each workflow file.

**To use English:** keep only `prague_events_en.yml` in `.github/workflows/`  
**To use Czech:** keep only `prague_events_cs.yml` in `.github/workflows/`  
**To run both:** keep both files — useful if you have two separate Discord channels

### 5. Run manually for the first time

**Actions → Prague Events Bot (EN) → Run workflow**  
or  
**Actions → Prague Events Bot (CS) → Run workflow**

---

## Adjusting the schedule

The bot runs at `4:00 UTC`, which equals `6:00 CEST` (summer time). For winter time (CET, UTC+1) update the cron line in your chosen workflow file:

```yaml
- cron: "0 5 * * *"   # 5:00 UTC = 6:00 CET
```

---

## Tech stack

- **Runtime:** Node.js 20 (no external dependencies — uses native `fetch`)
- **AI:** OpenAI `gpt-4o-mini-search-preview` — searches the web for current events
- **Automation:** GitHub Actions
- **Output:** Discord webhook
