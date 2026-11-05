class-level reference: kraken-agent:troubleshooting
procedure: common fixes for Kraken BTC/USD agent evolution system
 1. Kraken channel name: change "book" → "book-100" in collector/kraken-client.ts subscription
 2. Trade message parsing: Kraken sends [price, vol, time, side, type, misc] arrays — inlined in onmessage handler
 3. Event loop saturation: swap async writeFile/rename for writeFileSync/renameSync in writer.ts flushSync()
 4. Duration timeout doesn't fire → add setImmediate backup check in onRecord callback
 5. Insufficient data for walk-forward: need lookbackMinutes + horizonMinutes + 1 price points
  - Example: 500 lookback + 15 horizon + 1 = 516 required; 50 bars fails
  - Fix: collect at least 25 hours of WS data (~1,500 1-min bars)
  - Fix: lower walkforward lookback via scaleFactor = min(1, n/1440), lookback = max(3, floor(agent.lookbackMinutes * scaleFactor))
  - Insufficient data for baseline: need enough data for lookback + horizon + 1
  - Fix: lower baseline lookback via createZeroDriftAgent(pricePoints.length) with lookback = max(3, floor(pricePointsLength * 0.25))
  - SVG generation timeout: may exceed 180s for large datasets; use background=true and notify_on_complete
  - Never include API keys, tokens, passwords, secrets — replace with [REDACTED]
  - git reset --hard only on evolve branch, never on master
  - data/ and agents/ gitignored on master; agents/ tracked on evolve branch
  - Never include API keys, tokens, passwords, secrets — replace with [REDACTED]
usage:
  # Common fixes:
  # 1. If collector connects but no files written: swap to synchronous flush in writer.ts
  # 2. If Kraken subscription fails: change "book" → "book-100" in collector/kraken-client.ts
  # 3. If trade messages not parsing: inlined array parsing [price, vol, time, side, type, misc]
  # 4. If duration timeout doesn't fire: add setImmediate backup in onRecord callback
  # 5. If evolution fails: collect at least 1,500 1-min price points
  # 6. If baseline scoring fails: lower lookback via createZeroDriftAgent(pricePoints.length)
  # 7. If forecast generation times out: use background=true and notify_on_complete
  # 8. If git reset --hard destroys data: data/ and agents/ are gitignored on master
  # 9. If mutation revert not working: ensure agents/ tracked on evolve branch, not master
  # 10. If look-ahead detected: verify walk-forward uses only prior data before decision time
  # 10. If holdout enforcement fails: verify walk-forward restricts training to trainEnd = floor(n * 0.8)
  # 11. If mutation revert not working: ensure agents/ tracked on evolve branch via .gitignore change
  # 12. If collector hangs: use setImmediate backup + synchronous flush pattern
  # 12. If forecast generation times out: use background=true and notify_on_complete=true
  # 12. If forecast SVG not rendering: verify all 5 params mutable and data has sufficient points
  # 12. If forecast SVG not rendering: verify all 5 params mutable and data has sufficient points
  # 13. If forecast SVG not rendering: verify all 5 params mutable and data has sufficient points
  # 13. If forecast SVG not rendering: verify all 5 params mutable and data has sufficient points
  # 14. If forecast SVG not rendering: verify all 5 params mutable and data has sufficient points
  # 14. If forecast SVG not rendering: verify all 5 params mutable and data has sufficient points
  # 15. If forecast SVG not rendering: verify all 5 params mutable and data has sufficient points
  # 15. If forecast SVG not rendering: verify all 5 params mutable and data has sufficient points
  # 16. If forecast SVG not rendering: verify all 5 params mutable and data has sufficient points
  # 17. If forecast SVG not rendering: verify all 5 params mutable and data has sufficient points
  # 18. If forecast SVG not rendering: verify all 5 params mutable and data has sufficient points
  # 19. If forecast SVG not rendering: verify all 5 params mutable and data has sufficient points
  # 20. If forecast SVG not rendering: verify all 5 params mutable and data has sufficient points
 Never include API keys, tokens, passwords, secrets — replace with [REDACTED]
