# Kraken BTC/USD Agent Evolution System — Design Document

## Intent and Why

Build a self-improving ensemble of forecasting agents that learn from live Kraken BTC/USD order book and trade data. The system continuously evolves agent parameters through an evolutionary loop with git-backed commits, producing probabilistic forecasts from the current order book state.

## Goals

1. **Reliable data ingestion** — Record Kraken public websocket (order book 300 levels/side + trades) to timestamped local files, crash-safe, runnable for days
2. **Configurable agents** — 8 agents defined by JSON configs (lookback, block length, drift, vol scale, book imbalance toggle)
3. **Causal resampling** — Each agent generates 400 futures per decision time using only prior data
4. **Walk-forward evaluation** — Pinball loss at +15 min horizon, 20% holdout never seen during evolution
5. **Baseline comparison** — Zero-drift constant-vol and random-change controls reported alongside every agent
6. **Evolutionary loop** — Mutate worst agent per round; commit on improvement, hard reset on regression; CSV log
7. **Population dynamics** — Weight updates (top/bottom quartile), extinction at floor, spawn on gaps
8. **Production forecast** — Weight-mixed 1000 futures from NOW; print P(>NOW); plot paths vs live order book

## Non-Goals

- Multi-asset support (BTC/USD only)
- Real-time trading execution
- Hyperparameter optimization beyond the specified mutation scheme
- Distributed/horizontal scaling (single-process background collector + evolution loop)

## Anti-Goals

- Any lookahead bias in resampling or scoring
- Data loss on crash (hence periodic flushes)
- Silent failures — every round logged, every commit traceable

## Constraints

- **Language**: TypeScript (strict mode, no `any`, `noUncheckedIndexedAccess`)
- **Runtime**: Node.js 20+ (native `fetch`, `WebSocket`, `fs/promises`)
- **Testing**: Vitest, TDD — tests before implementation
- **Schemas**: Zod at all boundaries (config, websocket messages, file formats)
- **Theming**: CSS variables for any visualization output
- **Git**: Conventional commits, `reset --hard` on failed mutations

## Approaches Considered

### Data Collection

| Approach | Tradeoff |
|----------|----------|
| **Single background process with periodic JSONL flushes** (chosen) | Simple, crash-safe, easy to replay; slight I/O burst every flush |
| SQLite/WAL | More complex, overkill for append-only time series |
| Rolling binary files (e.g., Arrow/Parquet) | Efficient but adds dependency; JSONL is human-readable and sufficient |

### Agent Configuration

| Approach | Tradeoff |
|----------|----------|
| **JSON files in `agents/` dir, one per agent** (chosen) | Version-controlled, diffable, simple schema |
| Single config array | Harder to track per-agent history |
| Database | Overkill for 8 agents |

### Evolution Loop

| Approach | Tradeoff |
|----------|----------|
| **Git commit on success, `reset --hard` on failure** (chosen) | Full audit trail, trivial rollback, no custom state management |
| In-memory state with periodic snapshots | Loses history on crash, harder to audit |
| Separate mutation log + config store | Duplicates git's purpose |

### Resampling Method

| Approach | Tradeoff |
|----------|----------|
| **Block bootstrap with drift/vol scaling + optional book imbalance conditioning** (chosen) | Matches spec exactly; interpretable parameters |
| Parametric (GARCH, etc.) | More assumptions, harder to validate causality |
| Deep learning | Opaque, data-hungry, violates "beginner learning project" spirit |

## Architecture

```
src/
├── collector/           # Kraken websocket → JSONL files
│   ├── kraken-client.ts      # WebSocket connection, reconnection, subscription
│   ├── book-builder.ts       # Maintains 300-level L2 book from snapshots/updates
│   ├── writer.ts             # Periodic flush to timestamped JSONL (rotating)
│   └── index.ts              # Entry point: `pnpm collect --duration 2h`
│
├── agents/              # Agent definitions & evolution
│   ├── schema.ts             # Zod schemas for AgentConfig, AgentState
│   ├── config.ts             # Load/save agent JSON configs
│   ├── population.ts         # Weight updates, extinction, spawning
│   ├── evolution.ts          # Mutation, git commit/reset, CSV logging
│   └── index.ts
│
├── resampling/          # Causal block bootstrap
│   ├── engine.ts             # Core resampling: 1-min moves → 400 futures
│   ├── conditioning.ts       # Book imbalance conditioning
│   └── index.ts
│
├── scoring/             # Walk-forward pinball loss
│   ├── pinball.ts            # Quantile loss at +15 min
│   ├── walkforward.ts        # Train/test split, holdout enforcement
│   └── index.ts
│
├── baselines/           # Baseline agents
│   ├── zero-drift.ts         # Zero drift, constant vol
│   ├── random-change.ts      # Random walk control
│   └── index.ts
│
├── forecast/            # Production forecast & visualization
│   ├── mixer.ts              # Weight-weighted 1000 futures from NOW
│   ├── plot.ts               # SVG/HTML paths + order book heatmap
│   └── index.ts
│
├── data/                # Data loading utilities
│   ├── loader.ts             # Read JSONL, align book + trades, resample to 1-min
│   └── index.ts
│
└── cli.ts               # Main entry: collect | evolve | forecast | test
```

## Data Formats

### Collector Output (JSONL, one per flush)

```json
// book snapshot (every flush)
{"t": "2026-11-05T12:00:00.123Z", "type": "book", "bids": [[price, vol], ...], "asks": [[price, vol], ...]}
// trade (as received)
{"t": "2026-11-05T12:00:00.124Z", "type": "trade", "price": 12345.6, "vol": 0.01, "side": "buy", "id": "abc"}
```

### Agent Config (`agents/<id>.json`)

```json
{
  "id": "agent-0",
  "lookbackMinutes": 1440,
  "blockLengthMinutes": 30,
  "drift": 0.0,
  "volScale": 1.0,
  "useBookImbalance": false,
  "weight": 1.0,
  "roundsAtFloor": 0
}
```

### Evolution Log (`evolution.csv`)

```csv
round,timestamp,worstAgentId,mutation,param,oldValue,newValue,pinballBefore,pinballAfter,action,commitHash
```

## Review Focus (Spec-Implied Failure Modes)

1. **Lookahead bias in resampling** — Future data must never leak into futures generation. Test: synthetic data with known future, verify futures don't use it.
2. **Holdout contamination** — Evolution loop must never see last 20%. Test: mock data, assert holdout indices never passed to scoring during evolution.
3. **Websocket reconnection gaps** — Missed messages on reconnect corrupt book. Test: simulate disconnect/reconnect, verify book integrity via sequence numbers.
4. **Weight floor extinction edge case** — Agent at 0.3 for exactly 8 rounds → extinct; 7 rounds → survives. Test: boundary values.
5. **Git reset --hard on failure** — Failed mutation must leave repo clean. Test: force a failing mutation, verify `git status` clean and config reverted.

## Open Decisions for Human Partner

1. **Visualization output**: SVG (static) vs HTML/Canvas (interactive)? Spec says "plot the paths next to the order book" — SVG is simpler, HTML allows hover/tooltips.
2. **Flush interval**: "Every few minutes" — recommend 2 minutes (configurable via CLI).
3. **Mutation strategy**: "Change one thing" — which parameters are mutable? All five (lookback, blockLength, drift, volScale, useBookImbalance) or subset?
4. **Block bootstrap detail**: Stationary vs circular blocks? Recommend stationary with reflection at boundaries.
6. **Quantile for pinball**: Spec says "pinball loss at +15 minutes" — which quantile? Standard is 0.5 (median/MAE) or 0.05/0.95 for intervals. Recommend 0.5 for point forecast, configurable.