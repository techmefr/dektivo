import type { MatchEvent, Team } from '#shared/game'

export const useEventDescription = () => {
  const { t } = useI18n()
  const store = useMatchStore()

  const teamName = (team: Team): string => store.setup?.teamNames[team] || t(`teams.${team}`)

  const ownShapeName = (pieceId: string): string => {
    const piece = store.humanView?.ownPieces.find((ownPiece) => ownPiece.id === pieceId)
    return piece ? t(`shapes.${piece.shape}`) : ''
  }

  return (event: MatchEvent): string => {
    const payload = event.payload
    switch (payload.type) {
      case 'placed':
        return t('log.placed', { team: teamName(payload.team) })
      case 'moved':
        return t('log.moved', { shape: ownShapeName(payload.pieceId), cell: cellLabel(payload.to) })
      case 'rotated':
        return t('log.rotated', { shape: ownShapeName(payload.pieceId) })
      case 'blocked':
        return t('log.blocked', { shape: ownShapeName(payload.pieceId), cell: cellLabel(payload.at) })
      case 'ballPickedUp':
        return t('log.ballPickedUp', { team: teamName(payload.team), cell: cellLabel(payload.at) })
      case 'ballCarried':
        return t('log.ballCarried', { team: teamName(payload.team), cell: cellLabel(payload.to) })
      case 'tackled':
        return t('log.tackled', { team: teamName(payload.team), cell: cellLabel(payload.at) })
      case 'tackleFailed':
        return t('log.tackleFailed', { team: teamName(payload.team), cell: cellLabel(payload.at) })
      case 'tackleRefused':
        return t('log.tackleRefused', { team: teamName(payload.team), cell: cellLabel(payload.at) })
      case 'dieRolled':
        return t('log.dieRolled', { team: teamName(payload.team), value: payload.value })
      case 'ballKicked':
        return t(`log.${payload.kick}`, { team: teamName(payload.team), distance: payload.distance })
      case 'ballDeflected':
        return t(`log.${payload.behavior}`, { cell: cellLabel(payload.at) })
      case 'ballBouncedOffEdge':
        return t('log.edgeBounce')
      case 'ballCaught':
        return t(payload.intercepted ? 'log.intercepted' : 'log.caught', {
          team: teamName(payload.team),
          cell: cellLabel(payload.at),
        })
      case 'ballStopped':
        return t('log.stopped', { cell: cellLabel(payload.at) })
      case 'goal':
        return t('log.goal', { team: teamName(payload.team) })
      case 'turnEnded':
        return t(payload.reason === 'timeout' ? 'log.timeout' : 'log.turnEnded', { team: teamName(payload.team) })
      case 'matchEnded':
        return t('log.matchEnded')
    }
  }
}
