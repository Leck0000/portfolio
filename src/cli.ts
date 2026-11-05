import { program } from 'commander'
import { loadCollectorData, resampleTo1Minute } from './data/loader.js'
import { loadAgents, saveAllAgents, createInitialAgents } from './agents/config.js'
import { updateWeights } from './agents/population.js'
import { runEvolutionRound } from './agents/evolution.js'
import { scoreWalkForward, PricePoint } from './scoring/walkforward.js'
import { scoreAllBaselines } from './baselines/index.js'
import { mixFutures, generateForecastSVG } from './forecast/index.js'
import { writeFile } from 'node:fs/promises'
import { KrakenClient } from './collector/kraken-client.js'
import { RotatingWriter } from './collector/writer.js'
import { CollectorRecord } from './collector/types.js'

program
  .name('btc-evolve')
  .description('Kraken BTC/USD Agent Evolution System')

program
  .command('collect')
  .description('Record Kraken BTC/USD order book and trades')
  .option('-d, --duration <minutes>', 'Duration in minutes', '120')
  .option('-i, --interval <minutes>', 'Flush interval in minutes', '2')
  .action(async (options) => {
    const duration = Number(options.duration)
    const interval = Number(options.interval)
    
    const writer = new RotatingWriter('data', interval)
    await writer.init()

    const client = new KrakenClient({
      onBook: () => {},
      onTrade: () => {},
      onRecord: (record: CollectorRecord) => {
        writer.push(record)
      },
    })

    console.log(`[Collector] Starting for ${duration} minutes, flush every ${interval} minutes`)
    await client.connect()
    writer.start()

    setTimeout(async () => {
      console.log('[Collector] Duration reached, stopping...')
      client.disconnect()
      const finalFile = await writer.stop()
      if (finalFile) console.log(`[Collector] Final flush: ${finalFile}`)
      process.exit(0)
    }, duration * 60 * 1000)
  })

program
  .command('evolve')
  .description('Run evolution loop on collected data')
  .option('-r, --rounds <number>', 'Number of evolution rounds', '100')
  .option('-h, --horizon <minutes>', 'Prediction horizon in minutes', '15')
  .action(async (options) => {
    const rounds = Number(options.rounds)
    const horizon = Number(options.horizon)
    
    console.log('[Evolve] Loading data...')
    const rawPoints = await loadCollectorData()
    const pricePoints = resampleTo1Minute(rawPoints)
    console.log(`[Evolve] Loaded ${pricePoints.length} 1-min price points`)
    
    if (pricePoints.length < 100) {
      console.error('[Evolve] Insufficient data, need at least 100 points')
      process.exit(1)
    }
    
    let agents = await loadAgents()
    if (agents.length === 0) {
      console.log('[Evolve] No agents found, creating initial population...')
      agents = createInitialAgents(8)
      await saveAllAgents(agents)
    }
    console.log(`[Evolve] Loaded ${agents.length} agents`)
    
    const scoreAgent = async (agent: typeof agents[0]) => {
      const result = await scoreWalkForward(agent, pricePoints, horizon)
      return result.trainPinball
    }
    
    const baselineResults = await scoreAllBaselines(pricePoints, horizon)
    console.log('[Evolve] Baseline scores:')
    for (const b of baselineResults) {
      console.log(`  ${b.name}: train=${b.trainPinball.toFixed(6)}, holdout=${b.holdoutPinball.toFixed(6)}`)
    }
    
    for (let round = 1; round <= rounds; round++) {
      console.log(`\n[Evolve] Round ${round}/${rounds}`)
      
      const pinballScores = new Map<string, number>()
      for (const agent of agents) {
        const score = await scoreAgent(agent)
        pinballScores.set(agent.id, score)
        console.log(`  ${agent.id}: pinball=${score.toFixed(6)}, weight=${agent.weight.toFixed(3)}`)
      }
      
      const { agents: newAgents, logEntry } = await runEvolutionRound(agents, pinballScores, scoreAgent)
      agents = newAgents
      logEntry.round = round
      
      agents = updateWeights(agents, pinballScores)
      await saveAllAgents(agents)
      
      console.log(`  Mutation: ${logEntry.mutation} -> ${logEntry.action} (${logEntry.pinballBefore.toFixed(6)} -> ${logEntry.pinballAfter.toFixed(6)})`)
      
      if (round % 10 === 0) {
        const stats = agents.map(a => `${a.id}: w=${a.weight.toFixed(3)}`).join(', ')
        console.log(`  Weights: ${stats}`)
      }
    }
    
    console.log('\n[Evolve] Final holdout evaluation...')
    for (const agent of agents) {
      const result = await scoreWalkForward(agent, pricePoints, horizon)
      console.log(`  ${agent.id}: train=${result.trainPinball.toFixed(6)}, holdout=${result.holdoutPinball.toFixed(6)}, weight=${agent.weight.toFixed(3)}`)
    }
    
    for (const b of baselineResults) {
      console.log(`  ${b.name}: holdout=${b.holdoutPinball.toFixed(6)}`)
    }
    
    console.log('\n[Evolve] Done.')
  })

program
  .command('forecast')
  .description('Generate forecast from current survivors')
  .option('-m, --mix <number>', 'Number of mixed futures', '1000')
  .option('-o, --output <file>', 'Output SVG file', 'forecast.svg')
  .option('-h, --horizon <minutes>', 'Prediction horizon in minutes', '15')
  .action(async (options) => {
    const mixCount = Number(options.mix)
    const output = options.output
    const horizon = Number(options.horizon)
    
    console.log('[Forecast] Loading data...')
    const rawPoints = await loadCollectorData()
    const pricePoints = resampleTo1Minute(rawPoints)
    console.log(`[Forecast] Loaded ${pricePoints.length} 1-min price points`)
    
    const agents = await loadAgents()
    const survivors = agents.filter(a => a.weight > 0)
    console.log(`[Forecast] ${survivors.length} survivors`)
    
    const forecast = mixFutures(survivors, pricePoints, horizon, mixCount)
    console.log(`[Forecast] Share above NOW: ${(forecast.shareAboveNow * 100).toFixed(1)}%`)
    console.log(`[Forecast] Current price: $${forecast.currentPrice.toFixed(2)}`)
    
    const svg = generateForecastSVG(forecast, pricePoints, survivors, horizon)
    await writeFile(output, svg, 'utf-8')
    console.log(`[Forecast] Saved to ${output}`)
  })

program.parse()
