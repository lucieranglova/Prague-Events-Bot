# Prague-Events-Bot
# 🗓️ Prague Events Bot

Automatický Discord bot, který každý den ráno hledá zajímavé akce v Praze a okolí a posílá je na Discord. V pátek přijde víkendový digest, ostatní dny jen pokud se najde něco výjimečného.

---

## Jak to funguje

Bot běží každý den v 6:00 (CEST) přes GitHub Actions. Používá GPT-4o-mini se zapnutým web searchem, aby našel aktuální akce — farmářské trhy, výstavy, koncerty, Zoo Praha speciální programy, festivaly a další.

**Pátek** → pošle 8–10 akcí na celý víkend, seřazených od nejlevnější  
**Ostatní dny** → pošle až 3 tipy, jen pokud je něco výjimečného. Pokud ne, mlčí.

### Cenové kategorie

| Emoji | Cena |
|-------|------|
| 🟢 | Zdarma |
| 🟡 | Do 200 Kč |
| 🟠 | Do 500 Kč |
| 🔴 | 500 Kč a více |
| ⚪ | Cena neznámá |

### Ukázka výstupu

```
🗓️ Praha tento víkend — 12. – 13. dubna
─────────────────────────
🟢 Farmářský trh Jiřák
↳ Největší farmářský trh v Praze s čerstvými produkty od lokálních pěstitelů.
📍 nám. Jiřího z Poděbrad  ·  🕐 So 8:00–13:00  ·  💸 zdarma

🟡 Zoo Praha — komentované krmení tučňáků
↳ Speciální víkendový program pro celou rodinu.
📍 Zoo Praha, Troja  ·  🕐 So i Ne 14:00  ·  💸 180 Kč (vstupné do Zoo)

🟢 zdarma  🟡 do 200 Kč  🟠 do 500 Kč  🔴 500 Kč+
```

---

## Soubory

```
prague_events.js          # hlavní skript
.github/workflows/
  prague_events.yml       # GitHub Actions workflow
```

---

## Nastavení

### 1. Forkni nebo naklonuj repozitář

### 2. Vytvoř Discord webhook

V Discord serveru → Nastavení kanálu → Integrace → Webhooky → Nový webhook. Zkopíruj URL.

### 3. Přidej Secrets

V repozitáři: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Popis |
|--------|-------|
| `OPENAI_API_KEY` | Tvůj OpenAI API klíč |
| `DISCORD_WEBHOOK_PRAGUE_EVENTS` | URL Discord webhooku |

### 4. Spusť poprvé ručně

**Actions → Prague Events Bot → Run workflow**

---

## Úprava časování

Bot běží ve `4:00 UTC`, což odpovídá `6:00 CEST` (letní čas). Pro zimní čas (CET, UTC+1) změň v `prague_events.yml`:

```yaml
- cron: "0 5 * * *"   # 5:00 UTC = 6:00 CET
```

---

## Technologie

- **Runtime:** Node.js 20 (bez externích závislostí, používá nativní `fetch`)
- **AI:** OpenAI `gpt-4o-mini-search-preview` — prohledává web pro aktuální akce
- **Automatizace:** GitHub Actions
- **Výstup:** Discord webhook
