import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { CollectorRecord } from './types.js'

export class RotatingWriter {
  private buffer: CollectorRecord[] = []
  private readonly flushIntervalMs: number
  private readonly dataDir: string
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(dataDir: string = 'data', flushIntervalMinutes: number = 2) {
    this.dataDir = dataDir
    this.flushIntervalMs = flushIntervalMinutes * 60 * 1000
  }

  async init(): Promise<void> {
    await mkdir(this.dataDir, { recursive: true })
  }

  push(record: CollectorRecord): void {
    this.buffer.push(record)
  }

  async flush(): Promise<string | null> {
    if (this.buffer.length === 0) return null
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `collector-${timestamp}.jsonl`
    const filepath = join(this.dataDir, filename)
    const tempPath = filepath + '.tmp'

    const content = this.buffer.map(r => JSON.stringify(r)).join('\n') + '\n'
    const fs = await import('node:fs/promises')
    await fs.writeFile(tempPath, content, 'utf-8')
    await fs.rename(tempPath, filepath)
    
    const count = this.buffer.length
    this.buffer = []
    return filepath
  }

  start(): void {
    this.timer = setInterval(() => {
      this.flush().catch(err => console.error('Flush failed:', err))
    }, this.flushIntervalMs)
    this.timer.unref()
  }

  async stop(): Promise<string | null> {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    return this.flush()
  }
}
