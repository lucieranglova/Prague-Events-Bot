# 🗓️ Prague Events Bot

A Discord bot that searches for interesting events in Prague and the surrounding area every morning and posts them to Discord. On Fridays it sends a full weekend digest — on other days it only posts if something exceptional is on.

Supports **English** and **Czech** — choose your language by selecting the matching workflow.

---

*Automatický Discord bot, který každý den ráno hledá zajímavé akce v Praze a okolí. V pátek posílá víkendový digest, ostatní dny jen pokud se najde něco výjimečného.*

*Podporuje **angličtinu** a **češtinu** — jazyk vyberete volbou příslušného workflow souboru.*

---

## How it works / Jak to funguje

The bot runs every day at 6:00 AM (CEST) via GitHub Actions. It uses GPT-4o-mini with web search enabled to find current events — farmers markets, exhibitions, concerts, Prague Zoo special programmes, festivals, and more.

**Friday** → sends 8–10 events for the whole weekend, sorted from cheapest first  
**Other days** → sends up to 3 tips, only if something exceptional is happening. Otherwise stays silent.

---

Bot běží každý den v 6:00 (CEST) přes GitHub Actions. Používá GPT-4o-mini se zapnutým web searchem pro hledání aktuálních akcí — farmářské trhy, výstavy, koncerty, speciální programy Zoo Praha, festivaly a další.

**Pátek** → pošle 8–10 akcí na celý víkend, seřazených od nejlevnější  
**Ostatní dny** → pošle až 3 tipy, jen pokud je něco výjimečného. Jinak mlčí.

---

### Price categories / Cenové kategorie

| Emoji | EN | CZ |
|-------|----|----|
| 🟢 | Free | Zdarma |
| 🟡 | Up to 200 CZK | Do 200 Kč |
| 🟠 | Up to 500 CZK | Do 500 Kč |
| 🔴 | 500 CZK and above | 500 Kč a více |
| ⚪ | Price unknown | Cena neznámá |

### Example output / Ukázka výstupu

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

## Files / Soubory

```
prague_events.js              # main script / hlavní skript (bilingual / dvojjazyčný)
.github/workflows/
  prague_events_en.yml        # English workflow / anglické workflow
  prague_events_cs.yml        # Czech workflow / české workflow
```

---

## Setup / Nastavení

### 1. Fork or clone the repository / Forkni nebo naklonuj repozitář

### 2. Create a Discord webhook / Vytvoř Discord webhook

**EN:** In your Discord server → Channel Settings → Integrations → Webhooks → New Webhook. Copy the URL.

**CZ:** V Discord serveru → Nastavení kanálu → Integrace → Webhooky → Nový webhook. Zkopíruj URL.

### 3. Add Secrets / Přidej Secrets

**Settings → Secrets and variables → Actions → New repository secret**

| Secret | Description / Popis |
|--------|---------------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `DISCORD_WEBHOOK_PRAGUE_EVENTS` | Discord webhook URL |

### 4. Choose your language / Vyber jazyk

**EN:** Both workflows share the same script — the language is controlled by the `LANG` variable set inside each workflow file.

- Use English only → keep only `prague_events_en.yml` in `.github/workflows/`
- Use Czech only → keep only `prague_events_cs.yml` in `.github/workflows/`
- Use both → keep both files (useful for two separate Discord channels)

**CZ:** Oba workflow soubory sdílí stejný skript — jazyk je řízen proměnnou `LANG` nastavenou uvnitř každého workflow.

- Jen anglicky → ponech pouze `prague_events_en.yml` v `.github/workflows/`
- Jen česky → ponech pouze `prague_events_cs.yml` v `.github/workflows/`
- Obě verze → ponech oba soubory (vhodné pro dva samostatné Discord kanály)

### 5. Run manually for the first time / Spusť poprvé ručně

**Actions → Prague Events Bot (EN) → Run workflow**  
nebo / or  
**Actions → Prague Events Bot (CS) → Run workflow**

---

## Adjusting the schedule / Úprava časování

**EN:** The bot runs at `4:00 UTC` = `6:00 CEST` (summer time). For winter time (CET, UTC+1) update the cron line in your workflow file:

**CZ:** Bot běží ve `4:00 UTC` = `6:00 CEST` (letní čas). Pro zimní čas (CET, UTC+1) uprav řádek cron ve workflow souboru:

```yaml
- cron: "0 5 * * *"   # 5:00 UTC = 6:00 CET
```

---

## Tech stack

- **Runtime:** Node.js 20 (no external dependencies — uses native `fetch`)
- **AI:** OpenAI `gpt-4o-mini-search-preview`
- **Automation:** GitHub Actions
- **Output:** Discord webhook
