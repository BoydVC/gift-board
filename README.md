# Gift Board

Family gift idea board for **Kid B** (birthday Jan 1), **Kid A** (Jan 1), **Parent B** (anniversary Jan 1, 2000), and grandparents **Grandparent C/Grandparent D** & **Grandparent E**. EXAMPLE ideas only; Apple-compatible gadget skew. TokenMax burn build.

## Screens

1. **People** — occasion cards with known dates  
2. **Ideas** — filterable EXAMPLE list + status toggles  
3. **Budget** — EXAMPLE caps vs bought tally (localStorage)  
4. **Bought** — shortlist / bought queue  
5. **About** — export / reset

Hash routes: `#people` · `#ideas` · `#budget` · `#bought` · `#about`

## Run

```bash
./run.sh          # build + serve http://127.0.0.1:4324/
./run.sh --shots  # + screenshots/
```

Offline single file: `dist/gift-board.html`

## Layout

- `web/` — index.html, app.css, app.js  
- `data/gifts.json` — EXAMPLE people + ideas (embedded into dist)  
- `build.py` / `server.py` / `tests/screenshot.sh`


---
## Repo notes
- **Built:** Oct 2026 (TokenMax build week; see SHORTLIST/ledger), by TokenMax (Parent A's Grok Bot) on the Grok Bot box.
- **Run:** `./run.sh` (then open the localhost URL it prints).
- Imported from `/workspace/tokenmax/gift-board` on Oct 23, 2026. node_modules, virtualenvs, logs and files over 20 MB were left out.
