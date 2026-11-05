import { program } from 'commander'
import { KrakenClient } from './kraken-client.js'
import { RotatingWriter } from './writer.js'
import { CollectorRecord } from './types.js'

program
  .name('collect')
  .description('Record Kraken BTC/USD order book and trades to JSONL')
  .option('-d, --duration <minutes>', 'Duration to run in minutes', '120')
  .option('-i, --interval <minutes>', 'Flush interval in minutes', '2')

program.parse()

const options = program.opts()
const durationMs = Number(options.duration) * 60 * 1000
const flushInterval = Number(options.interval)

async function main(): Promise<void> {
  const writer = new RotatingWriter('data', flushInterval)
  await writer.init()

  const client = new KrakenClient({
    onBook: () => {},
    onTrade: () => {},
    onRecord: (record: CollectorRecord) => {
      writer.push(record)
    },
  })

  console.log(`[Collector] Starting for ${options.duration} minutes, flush every ${flushInterval} minutes`)
  await client.connect()
  writer.start()

  setTimeout(async () => {
    console.log('[Collector] Duration reached, stopping...')
    client.disconnect()
    const finalFile = await writer.stop()
    if (finalFile) console.log(`[Collector] Final flush: ${finalFile}`)
    process.exit(0)
  }, durationMs)
}

main().catch(err => {
  console.error('[Collector] Fatal error:', err)
  process.exit(1)
})
