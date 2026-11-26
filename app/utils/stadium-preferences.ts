export const parseStadiumPreferences = (stored: string | null): { enabled: boolean; volume: number } => {
  try {
    const value = JSON.parse(stored ?? 'null')
    return {
      enabled: value?.enabled === true,
      volume: typeof value?.volume === 'number' && Number.isFinite(value.volume)
        ? Math.min(100, Math.max(0, value.volume)) : 35,
    }
  } catch { return { enabled: false, volume: 35 } }
}
