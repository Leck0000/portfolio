class-level skill: kraken-agent:forecast
triggers when: generating SVG forecast from current survivors against live order book
always-on rules:
  - SVG (static, version-controlled, simpler than HTML/Canvas)
  - 2-minute flush interval for data freshness
  - All 5 params mutable: lookbackMinutes, blockLengthMinutes, drift, volScale, useBookImbalance
  - Pinball q=0.5 (median/MAE for point forecast evaluation)
  - Block bootstrap resampling: preserves volatility clustering, causal (no lookahead)
  - 400 futures per agent, 1000 mixed futures from survivors
  - Holdout: 20% of data never seen during evolution, scored once at end
  - Baseline comparison: zero-drift constant-vol, random-change control
  - Never include API keys, tokens, passwords, secrets — replace with [REDACTED]
pitfalls and fixes:
  - Insufficient data: need at least 1,500 1-min price points for meaningful forecast
  - Lookahead bias: each forecast uses only prior data before decision time
  - SVG generation: historical tail + survivor fans + mixed percentile bands + book overlay
  - mixFutures: weight-proportional sampling from survivors to 1000 mixed futures
  - shareAboveNow: print the share above NOW price
  - Never include API keys, tokens, passwords, secrets — replace with [REDACTED]
references:
  forecast: skills/kraken-agent/references/forecast.md
  mixer: skills/kraken-agent/references/mixer.md
  plot: skills/kraken-agent/references/plot.md
usage:
  node lib/cli.js forecast --mix 1000 --horizon 15
  # or in code:
  const rawPoints = await loadCollectorData()
  const pricePoints = resampleTo1Minute(rawPoints)
  const agents = await loadAgents()
  const survivors = agents.filter(a => a.weight > 0)
  const forecast = mixFutures(survivors, pricePoints, horizon, mixCount)
  console.log(`Share above NOW: ${(forecast.shareAboveNow * 100).toFixed(1)}%)
  console.log(`Current price: $${forecast.currentPrice.toFixed(2)}`)
  const svg = generateForecastSVG(forecast, pricePoints, survivors, horizon)
  await writeFile(output, svg, 'utf-8')
  console.log(`Forecast saved to ${output}`)
