import { buildMatchRecord } from '#shared/game'
import type { MatchState } from '#shared/game'
import type { MatchSetup } from '~/utils/saved-match'

type DownloadedMatch = {
  match: MatchState
  setup: MatchSetup | null
  startedAt: number | null
  endedAt: number | null
}

const timestampForFileName = (date: Date): string => date.toISOString().slice(0, 19).replaceAll(':', '-')

export const downloadMatchRecord = ({ match, setup, startedAt, endedAt }: DownloadedMatch): void => {
  const exportedAt = new Date()
  const content = JSON.stringify(
    {
      exportedAt: exportedAt.toISOString(),
      startedAt: startedAt === null ? null : new Date(startedAt).toISOString(),
      endedAt: endedAt === null ? null : new Date(endedAt).toISOString(),
      setup,
      record: buildMatchRecord(match),
    },
    null,
    2,
  )
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `dektivo-${timestampForFileName(exportedAt)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
