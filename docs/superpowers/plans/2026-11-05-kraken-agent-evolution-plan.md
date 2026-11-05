# Kraken BTC/USD Agent Evolution System — Implementation Plan

## Goal

Build a complete system that collects live Kraken BTC/USD order book + trade data via websocket, runs 8 configurable agents through a walk-forward evolutionary loop with pinball-loss scoring, and produces a weight-mixed 1000-future forecast plotted against the live order book.

## Architecture

See the design doc for full architecture. This plan decomposes into 5 sub-projects:
1. `collector` — Kraken websocket data ingest
2. `agents` — Agent config, population, evolution
3. `resampling` — Causal block bootstrap into 400 futures
4. `scoring` — Walk-forward pinball loss at +15 min
5. `baselines` + `forecast` — Baselines, mixing, visualization

All share the `data/` loader and strict TS/no-any constraints.

## Tech Stack

- Node.js 20+
- TypeScript strict (`noImplicitAny`, `strict`, `noUncheckedIndexedAccess`)
- Zod at all boundaries
- vitest for testing
- native fetch + WebSocket
- git for evolution
- SVG for visualization

## Global Constraints (from spec, every task)

- Data loss on crash must be impossible (periodic timestamped JSONL flushes)
- No lookahead bias — futures generation must use only prior data
- Evolution loop must never see the 20% holdout
- Git commit on improvement, `reset --hard` on regression
- Weight: top quartile ×1.05, bottom quartile ×0.95, floor 0.3, cap 2.5
- Agent at floor for 8 rounds → extinct; spawn on gap in mix
- Pinball quantile = 0.5
- Walk-forward: train on first 80%, score once on holdout at end

## Sub-Project Plans

### Sub-Project A: Data Collector (collector/)

**Files to create/modify:**
- `src/collector/kraken-client.ts` — WebSocket subscription to `wss://ws.kraken.com`, subscribe `~trade:BTC/USD` and `book`, handle reconnection
- `src/collector/book-builder.ts` — Maintain 300-level best bid/ask book from snapshot + update messages; extract top 300 bids/asks
- `src/collector/writer.ts` — Rotating JSONL writer; flush every 2 minutes; filename pattern `data/collector-YYYYMMDD-HHMMSS.jsonl`; ensure atomic write (write to temp, rename)
- `src/collector/index.ts` — CLI entry: `pnpm collect --duration 2h`

**Key tests:**
- WebSocket connect + subscribe → receive first book snapshot + trade
- Reconnection preserves book state (re-apply pending updates)
- JSONL flush writes exactly 2-min window; no data loss on process kill (atomic rename guarantees this)
- Top-300 extraction: when >300 levels arrive, keep best 300 bids + best 300 asks

### Sub-Project B: Agent Config & Population (agents/)

**Files to create/modify:**
- `src/agents/schema.ts` — Zod schema for `AgentConfig`: id, lookbackMinutes (number>0), blockLengthMinutes (number>0), drift (number), volScale (number>0), useBookImbalance (boolean), weight (number>0, default 1.0), roundsAtFloor (number, default 0)
- `src/agents/config.ts` — Load all `agents/*.json`, assign initial weight=1.0, save round state
- `src/agents/population.ts` — Weight updates per round: after scoring, compute quartiles; top quartile ×1.05, bottom quartile ×0.95; floor 0.3, cap 2.5; agent at floor 8 rounds → extinct; new agent spawn when mix shows gap (detected when stddev of weights < threshold indicating convergence, or when an agent was just extinct and a fresh one enters at weight 1.0)
- `src/agents/evolution.ts` — Mutation: one of the 5 params changes by a small delta (Gaussian σ=0.1 for continuous; toggle flip for boolean); git commit if pinball improves; `git reset --hard` if not; CSV log entry
- `src/agents/index.ts` — CLI entry: `pnpm evolve --rounds 100`

**Key tests:**
- Zod schema validates all agent configs; rejects invalid (e.g., negative lookback)
- Weight update: top quartile ×1.05 → may exceed cap 2.5 → clamp; bottom ×0.95 → may go below floor 0.3 → clamp
- Extinction: roundsAtFloor reaches 8 → mark dead
- Spawn: when a slot opens (agent extinct) and weight stddev < 0.2 → new agent at weight 1.0, roundsAtFloor=0
- Mutation: change exactly one parameter; old pinball ≥ new pinball → commit; else reset --hard and log

### Sub-Project C: Causal Resampling Engine (resampling/)

**Files to create/modify:**
- `src/resampling/engine.ts` — Core: given 1-min returns series (from data loader), for each of 400 futures:
  1. At decision time t, take block bootstrap resample of length `blockLengthMinutes` from data strictly before t
  2. Apply drift × volScale scaling
  3. If useBookImbalance: compute mid-price spread from current book; condition resample direction
  4. Return 400 future price paths (terminal price at +15 min horizon)
- `src/resampling/conditioning.ts` — Book imbalance signal: `(bids[0].price + asks[0].price)/2` mid; compute imbalance = (bids[0].vol - asks[0].vol)/(bids[0].vol + asks[0].vol); use as directional tilt
- `src/resampling/index.ts` — Export `resampleFutures(prices1min: number[], bookSnapshot: Book, config: AgentConfig): number[][]` (400 × horizonLength)

**Key tests:**
- Given monotonically rising price series, agent with positive drift produces futures biased upward
- Block bootstrap with same seed produces reproducible results
- useBookImbalance=true shifts futures direction when imbalance > threshold (e.g., |imb| > 0.1)
- resample uses ONLY data before decision time (verify no index > t)

### Sub-Project D: Walk-Forward Scoring (scoring/)

**Files to create/modify:**
- `src/scoring/pinball.ts` — Pinball loss: `ρ(u) = u × (0.5 - I(u < 0))` for quantile 0.5 simplifies to `|u|` (MAE). But keep general form for configurability.
- `src/scoring/walkforward.ts` — Core:
  1. Split data: train = first 80%, holdout = last 20%
  2. For each decision time in train: run agent resampling → predict +15 min price → compute pinball loss vs actual
  3. Accumulate average pinball loss across all decision times in train
  4. After training loop completes, run ONE final walk-forward on holdout: generate 400 futures using ONLY holdout data (but agent was trained on train-only), score pinball loss once
  5. Return {trainLoss, holdoutLoss, futuresPath}
- `src/scoring/index.ts` — Export scoring functions

**Key tests:**
- Walk-forward train/test split: holdout indices never appear in any resample call during train loop
- Pinball loss for quantile 0.5 = MAE
- Given known price path, pinball loss computes correctly
- Holdout scoring: agent never seen the holdout data during evolution; final score reported once

### Sub-Project E: Baselines (baselines/)

**Files to create/modify:**
- `src/baselines/zero-drift.ts` — Agent config: drift=0, volScale=1.0, useBookImbalance=false. Resample like regular agents but no drift term.
- `src/baselines/random-change.ts` — Agent config: drift=0, volScale=1.0, but at each decision step add random sign flip (±1) to the move; this is the "random-change control"
- `src/baselines/index.ts` — Export both baselines; score each against the same holdout set used for agents

### Sub-Project F: Production Forecast & Visualization (forecast/)

**Files to create/modify:**
- `src/forecast/mixer.ts` — Weight-weighted mix: draw 1000 futures from the survivor pool, weighted by each agent's current weight. Print "share above NOW" = proportion of mixed futures where terminal price > current mid price.
- `src/forecast/plot.ts` — Generate SVG: x-axis = time to +15 min horizon; y-axis = price; plot each survivor's 400 terminal prices as faint lines; overlay the weight-mixed path (bold); overlay live order book mid-price as horizontal bar; include current timestamp.
- `src/forecast/index.ts` — CLI entry: `pnpm forecast --mix 1000 --out forecast.svg`

**Key output:**
- `forecast.svg` showing paths next to order book state
- Console: "Share above NOW: X.Y%"

## Task Decomposition

### Task 1: Initialize repo, TS config, dependencies

**Files:**
- `package.json` (with scripts: collect, evolve, forecast, test)
- `tsconfig.json` (strict mode, no any, lib: es2020, dom)
- `vitest.config.ts`
- `.gitignore`

**Steps:**
1. `npm init -y` (or verify existing)
2. `npm i -D typescript @types/node vitest @types/ws zod`
3. `npx tsc --init` with strict settings
4. Add vitest config
5. Add scripts to package.json

**Deliverable:** `package.json`, `tsconfig.json`, `vitest.config.ts` all passing `npx tsc --noEmit` and `npx vitest run` (empty suite passes)

### Task 2: Implement data collector skeleton (sub-project A, files)

**Files:** `src/collector/`

**Steps:**
1. Create `src/collector/kraken-client.ts` — WebSocket connection to Kraken, subscribe trade + book, handle ping/pong, reconnect on close
2. Create `src/collector/book-builder.ts` — Class maintaining bids[][], asks[][] (max 300 levels each); handle `BookSnapshot` and `BookL3` messages
3. Create `src/collector/writer.ts` — Rotating file writer; every 2 min write current book + trades to timestamped JSONL; atomic rename
4. Create `src/collector/index.ts` — CLI: `pnpm collect --duration <minutes>`; start collector, run for duration, flush on exit

**Deliverable:** `collector` can run 2 minutes, write `data/collector-*.jsonl` with valid JSONL entries; exit cleanly

### Task 3: Implement agent schema & population (sub-project B, files)

**Files:** `src/agents/`

**Steps:**
1. Create `src/agents/schema.ts` — Zod agent config schema with all 5 params + weight + roundsAtFloor
2. Create `src/agents/config.ts` — Load agents from `agents/` dir, assign default weight=1.0
3. Create `src/agents/population.ts` — Weight update logic per the spec (quartiles, floor/cap, extinction, spawn)
4. Create `src/agents/evolution.ts` — Mutation engine: change one param by Gaussian delta; git commit/reset; CSV log

**Deliverable:** Agent configs can be loaded; population updates weights correctly; mutation changes exactly one param

### Task 4: Implement causal resampling engine (sub-project C, files)

**Files:** `src/resampling/`

**Steps:**
1. Create `src/resampling/engine.ts` — Core resampleFutures function; block bootstrap from 1-min series before decision time
2. Create `src/resampling/conditioning.ts` — Book imbalance conditioning logic
3. Create `src/resampling/index.ts` — Export API

**Deliverable:** Given price series + book + agent config, returns 400 future terminal prices; uses only data before each decision time

### Task 5: Implement walk-forward scoring (sub-project D, files)

**Files:** `src/scoring/`

**Steps:**
1. Create `src/scoring/pinball.ts` — Pinball loss function for quantile 0.5
2. Create `src/scoring/walkforward.ts` — Full walk-forward: train/test split, average pinball on train, single final score on holdout
3. Create `src/scoring/index.ts` — Export scoring API

**Deliverable:** `scoreWalkForward(agentConfig, priceSeries, bookSeries)` returns {trainPinball, holdoutPinball, trainFutures, holdoutFutures}

### Task 6: Implement baselines (sub-project E, files)

**Files:** `src/baselines/`

**Steps:**
1. Create `src/baselines/zero-drift.ts` — Agent config with drift=0, volScale=1.0
2. Create `src/baselines/random-change.ts` — Agent config with drift=0, volScale=1.0, random sign flip at each step
3. Create `src/baselines/index.ts` — Score both against same holdout

**Deliverable:** Both baselines produce pinball loss scores comparable to agents

### Task 7: Implement production forecast & SVG plot (sub-project F, files)

**Files:** `src/forecast/`

**Steps:**
1. Create `src/forecast/mixer.ts` — Weight-weighted 1000-future mix; compute share above NOW
2. Create `src/forecast/plot.ts` — SVG generation: price paths + order book mid
3. Create `src/forecast/index.ts` — CLI: generate forecast.svg

**Deliverable:** `forecast.svg` renders; console prints "Share above NOW: X%"

### Task 8: Wire main CLI (cli.ts)

**Files:** `src/cli.ts`

**Steps:**
1. Create main CLI with subcommands: `collect`, `evolve`, `forecast`, `test`
2. Wire: `collect` → data collector; `evolve` → evolution loop; `forecast` → mix + plot

**Deliverable:** `pnpm <subcommand>` works for each

### Task 9: Full integration test

**Steps:**
1. Run collector for 5 minutes (simulated or with rate-limited API)
2. Load collected data into scoring loop
3. Run evolution for 5 rounds
4. Generate forecast SVG
5. Verify all pieces integrate end-to-end

**Deliverable:** Full run from data collection through evolution to forecast, all passing

## Review Focus (from design doc)

1. **Lookahead bias** — Every task checked: resample indices must be < decision time t
2. **Holdout contamination** — Walk-forward split enforced in scoring task; evolution log never references holdout indices
3. **Git reset --hard** — Evolution task: on failed mutation, `git reset --hard` must leave repo clean; test verifies
4. **Weight floor at 8 rounds** — Population task: boundary test for roundsAtFloor = 7 vs 8
5. **Pinball = MAE at q=0.5** — Scoring task: known MAE path verified

## Self-Review Checklist

- [ ] Spec coverage: All 8 user requirements mapped to tasks
- [ ] Step granularity: Each task step is unambiguous, one reasonable implementation
- [ ] Type consistency: All function signatures use explicit types; no `any` in tsconfig
- [ ] Review Focus: 5 failure modes each have owning task with test
- [ ] Proportion: Plan length reasonable vs spec (this doc < 30 pages vs spec ~6 pages)

**Plan saved to** `docs/superpowers/plans/2026-11-05-kraken-agent-evolution-plan.md`.

Ready to proceed with Task 1 once human partner confirms.