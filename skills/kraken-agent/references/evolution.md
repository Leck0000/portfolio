class-level reference: kraken-agent:evolution:evolution-procedure
procedure: run evolution loop on collected data
 1. loadCollectorData() → resampleTo1Minute() → pricePoints
 2. if pricePoints.length < 1500: error 'Insufficient data, need at least 1,500 points'
 3. loadAgents() → if 0: createInitialAgents(8, pricePoints.length) → saveAllAgents()
 4. for round = 1 to rounds:
       a. scoreWalkForward(agent, pricePoints, horizon) → trainPinball
       b. build Map<string, number> pinballScores (agent.id → score)
       c. runEvolutionRound(agents, pinballScores, scoreAgent) → newAgents, logEntry
          - mutation: param change (Gaussian for continuous, flip for boolean)
          - action: 'commit' if score improved, 'reset' if not
          - git commit on improvement, git reset --hard on regression
          - logEntry: mutation, action, pinballBefore, pinballAfter
       d. updateWeights(agents, pinballScores) → weight adjustments
          - top quartile x1.05, bottom quartile x0.95, floor 0.3, cap 2.5
          - agent at floor for 8 rounds → extinct, new spawn when mix shows gap
       e. saveAllAgents(agents)
       f. console.log(`Mutation: ${logEntry.mutation} -> ${logEntry.action} (${logEntry.pinballBefore.toFixed(6)} -> ${logEntry.pinballAfter.toFixed(6)})`)
       g. if round % 10 === 0: console.log(`Weights: ${agents.map(a => \`${a.id}: w=\${a.weight.toFixed(3)}\`).join(', ')}`)
 5. console.log('Final holdout evaluation...')
 6. for each agent: console.log(`  ${agent.id}: train=${result.trainPinball.toFixed(6)}, holdout=${result.holdoutPinball.toFixed(6)}, weight=${agent.weight.toFixed(3)}`)
 7. for each baseline: console.log(`  ${b.name}: holdout=${b.holdoutPinball.toFixed(6)}`)
 8. console.log('Done.')
 pitfalls and fixes:
  - Insufficient data: need at least 1,500 1-min price points for walk-forward
  - Lookahead bias: each forecast uses only prior data before decision time
  - Insufficient data for walk-forward: need lookbackMinutes + horizonMinutes + 1 price points
  - Baseline scoring: need enough data for lookback + horizon + 1
  - Evolution loop timeout: use setImmediate for round stepping under data load
  - Mutation revert: git reset --hard HEAD reverts bad mutation, config restored from disk
  - Agent count stays 8: extinct IDs replaced by new spawns
  - Never include API keys, tokens, passwords, secrets — replace with [REDACTED]
usage:
  node lib/cli.js evolve --rounds 100 --horizon 15
  # or in code:
  const rawPoints = await loadCollectorData()
  const pricePoints = resampleTo1Minute(rawPoints)
  let agents = await loadAgents()
  if (agents.length === 0) { agents = createInitialAgents(8, pricePoints.length); await saveAllAgents(agents) }
  const scoreAgent = async (agent) => await scoreWalkForward(agent, pricePoints, horizon)
  const baselineResults = await scoreAllBaselines(pricePoints, horizon)
  for (let round = 1; round <= rounds; round++) { ... }
