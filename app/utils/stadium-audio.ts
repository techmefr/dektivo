export class StadiumAudioEngine {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private cheerGain: GainNode | null = null
  private sources: AudioScheduledSourceNode[] = []
  private request = 0
  private disposed = false
  private active = false

  constructor(private readonly createContext: () => AudioContext = () => new AudioContext()) {}

  private initialize() {
    const context = this.createContext()
    this.context = context
    const master = context.createGain()
    master.gain.value = 0
    master.connect(context.destination)
    this.master = master
    const noise = context.createBuffer(1, context.sampleRate * 6, context.sampleRate)
    const samples = noise.getChannelData(0)
    let previous = 0
    for (let index = 0; index < samples.length; index += 1) {
      previous = (previous + (Math.random() * 2 - 1) * 0.08) / 1.02
      samples[index] = previous * 3
    }
    const source = context.createBufferSource()
    source.buffer = noise
    source.loop = true
    const filter = context.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 650
    filter.Q.value = 0.5
    source.connect(filter)
    const ambience = context.createGain()
    ambience.gain.value = 0.23
    filter.connect(ambience)
    ambience.connect(master)
    const cheerFilter = context.createBiquadFilter()
    cheerFilter.type = 'highpass'
    cheerFilter.frequency.value = 350
    const cheerGain = context.createGain()
    cheerGain.gain.value = 0
    source.connect(cheerFilter)
    cheerFilter.connect(cheerGain)
    cheerGain.connect(master)
    this.cheerGain = cheerGain
    const swell = context.createOscillator()
    swell.frequency.value = 0.14
    const depth = context.createGain()
    depth.gain.value = 0.07
    swell.connect(depth)
    depth.connect(ambience.gain)
    this.sources = [source, swell]
    source.start()
    swell.start()
  }

  setVolume(volume: number) {
    if (!this.master || !this.context) return
    const normalized = Number.isFinite(volume) ? Math.min(100, Math.max(0, volume)) / 100 : 0
    this.master.gain.setValueAtTime(this.active ? normalized : 0, this.context.currentTime)
  }

  async setActive(active: boolean, volume: number): Promise<boolean> {
    const request = ++this.request
    this.active = active && !this.disposed
    if (!this.active) {
      this.resetCheer()
      this.setVolume(0)
      if (this.context && this.context.state !== 'closed') await this.context.suspend()
      return false
    }
    try {
      if (!this.context) this.initialize()
      const context = this.context!
      await context.resume()
      if (this.disposed || request !== this.request) return false
      if (context.state !== 'running') throw new Error('Audio context did not start')
      this.setVolume(volume)
      return true
    } catch (error) {
      if (request === this.request) {
        this.active = false
        this.setVolume(0)
      }
      throw error
    }
  }

  cheer() {
    if (!this.active || this.context?.state !== 'running' || !this.cheerGain) return
    const now = this.context.currentTime
    this.resetCheer()
    this.cheerGain.gain.linearRampToValueAtTime(0.8, now + 0.18)
    this.cheerGain.gain.exponentialRampToValueAtTime(0.01, now + 1.6)
    this.cheerGain.gain.setValueAtTime(0, now + 1.8)
  }

  private resetCheer() {
    if (!this.cheerGain || !this.context) return
    this.cheerGain.gain.cancelScheduledValues(this.context.currentTime)
    this.cheerGain.gain.setValueAtTime(0, this.context.currentTime)
  }

  async dispose() {
    this.disposed = true
    ++this.request
    this.active = false
    this.resetCheer()
    this.setVolume(0)
    for (const source of this.sources) { source.stop(); source.disconnect() }
    this.sources = []
    if (this.context && this.context.state !== 'closed') await this.context.close()
    this.context = null
    this.master = null
    this.cheerGain = null
  }
}
