import { describe, expect, it, vi } from 'vitest'
import { StadiumAudioEngine } from './stadium-audio'

const fakeAudio = () => {
  const parameter = () => ({
    value: 0,
    setValueAtTime: vi.fn(), cancelScheduledValues: vi.fn(),
    linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(),
  })
  const gains: ReturnType<typeof parameter>[] = []
  const sources: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }[] = []
  const node = () => ({ connect: vi.fn(), disconnect: vi.fn() })
  const context = {
    state: 'suspended', currentTime: 0, sampleRate: 8000, destination: {},
    createGain: () => { const gain = parameter(); gains.push(gain); return { ...node(), gain } },
    createBuffer: () => ({ getChannelData: () => new Float32Array(64) }),
    createBiquadFilter: () => ({ ...node(), type: '', frequency: parameter(), Q: parameter() }),
    createBufferSource: () => {
      const source = { ...node(), buffer: null, loop: false, start: vi.fn(), stop: vi.fn() }
      sources.push(source)
      return source
    },
    createOscillator: () => {
      const source = { ...node(), frequency: parameter(), start: vi.fn(), stop: vi.fn() }
      sources.push(source)
      return source
    },
    resume: vi.fn(async () => { context.state = 'running' }),
    suspend: vi.fn(async () => { context.state = 'suspended' }),
    close: vi.fn(async () => { context.state = 'closed' }),
  }
  const factory = vi.fn(() => context as unknown as AudioContext)
  return { context, factory, gains, sources }
}

describe('stadium sound lifecycle', () => {
  it('creates nothing before explicit activation and reuses a single graph', async () => {
    const fake = fakeAudio()
    const engine = new StadiumAudioEngine(fake.factory)
    await engine.setActive(false, 35)
    expect(fake.factory).not.toHaveBeenCalled()
    await engine.setActive(true, 35)
    for (let count = 0; count < 10; count += 1) {
      engine.cheer()
      await engine.setActive(false, 35)
      expect(fake.gains[2]!.cancelScheduledValues).toHaveBeenCalled()
      expect(fake.gains[0]!.setValueAtTime).toHaveBeenLastCalledWith(0, 0)
      await engine.setActive(true, 35)
    }
    expect(fake.factory).toHaveBeenCalledTimes(1)
    expect(fake.sources).toHaveLength(2)
    fake.sources.forEach((source) => expect(source.start).toHaveBeenCalledTimes(1))
    engine.setVolume(0)
    expect(fake.gains[0]!.setValueAtTime).toHaveBeenLastCalledWith(0, 0)
    await engine.dispose()
    expect(fake.context.close).toHaveBeenCalledTimes(1)
    fake.sources.forEach((source) => expect(source.stop).toHaveBeenCalledTimes(1))
    expect(await engine.setActive(true, 35)).toBe(false)
  })
  it('does not replay clamor on resume or cheer while inactive', async () => {
    const fake = fakeAudio()
    const engine = new StadiumAudioEngine(fake.factory)
    await engine.setActive(true, 35)
    engine.cheer()
    expect(fake.gains[2]!.linearRampToValueAtTime).toHaveBeenCalledTimes(1)
    await engine.setActive(false, 35)
    engine.cheer()
    await engine.setActive(true, 35)
    expect(fake.gains[2]!.linearRampToValueAtTime).toHaveBeenCalledTimes(1)
    await engine.dispose()
  })
  it('reports failed activation and can retry', async () => {
    const fake = fakeAudio()
    fake.context.resume.mockRejectedValueOnce(new Error('Denied'))
    const engine = new StadiumAudioEngine(fake.factory)
    await expect(engine.setActive(true, 35)).rejects.toThrow('Denied')
    expect(fake.gains[0]!.setValueAtTime).toHaveBeenLastCalledWith(0, 0)
    expect(await engine.setActive(true, 35)).toBe(true)
    await engine.dispose()
  })
  it('does not unmute when an old resume finishes after disposal', async () => {
    const fake = fakeAudio()
    let resolveResume = () => {}
    fake.context.resume.mockImplementationOnce(() => new Promise<void>((resolve) => { resolveResume = resolve }))
    const engine = new StadiumAudioEngine(fake.factory)
    const pending = engine.setActive(true, 80)
    await engine.dispose()
    resolveResume()
    expect(await pending).toBe(false)
    expect(fake.gains[0]!.setValueAtTime).toHaveBeenLastCalledWith(0, 0)
  })
  it('reports unsupported audio without breaking cleanup', async () => {
    const engine = new StadiumAudioEngine(() => { throw new Error('Unsupported') })
    await expect(engine.setActive(true, 35)).rejects.toThrow('Unsupported')
    await engine.dispose()
  })
})
