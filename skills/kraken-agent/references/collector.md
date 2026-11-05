class-level reference: kraken-agent:collector:collector-procedure
procedure: record Kraken BTC/USD order book and trades to JSONL
 1. node lib/cli.js collect --duration N --interval M
 2. KrakenClient connects to wss://ws.kraken.com
 3. Subscribes to "trade" and "book-100" channels
 4. onRecord callback: recordCount++, writer.push(record), check duration
 5. setImmediate backup: const backupCheck = () => { if (!stopped && elapsed >= durationMs + 5000) stop('Duration timeout (backup)') else setImmediate(backupCheck) }
 6. writer.start() begins interval-based auto-flush
 7. Synchronous flush: writer.flushSync() uses writeFileSync/renameSync .tmp+rename pattern
 8. Duration reached: stop('Duration reached') → writer.flushSync() → process.exit(0)
 9. SIGINT/SIGTERM: stop('SIGINT') / stop('SIGTERM') → writer.flushSync() → process.exit(0)
 10. Never modify .env or credential files — leave them untouched unless user explicitly asks
 pitfalls and fixes:
  - setTimeout/setInterval starvation under high-frequency WS messages → use setImmediate backup
  - Kraken "book" channel rejected → use "book-100" (depth 10, 25, 100, 500, 1000 supported)
  - Trade message array format [price, vol, time, side, type, misc] — inlined parsing in onmessage
  - Event loop saturation from WS messages → synchronous flush, setImmediate backup
  - Duration timeout doesn't fire → check in onRecord callback + setImmediate backup
  - Forecast SVG generation: historical tail + survivor fans + mixed percentile bands + book overlay
  - Never include API keys, tokens, passwords, secrets — replace with [REDACTED]
usage:
  node lib/cli.js collect --duration 120 --interval 2
  # or in code:
  const writer = new RotatingWriter('data', interval)
  await writer.init()
  const client = new KrakenClient({ onRecord, onBook, onTrade })
  await client.connect()
  writer.start()
