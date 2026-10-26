export type IllegalActionCode =
  | 'notPlaying'
  | 'notYourTurn'
  | 'noActionsLeft'
  | 'unknownPiece'
  | 'illegalMove'
  | 'illegalKick'

export type PlacementErrorCode =
  | 'notPlacementPhase'
  | 'alreadyPlaced'
  | 'wrongPieceSet'
  | 'outsideOwnHalf'
  | 'sharedCell'

export class IllegalActionError extends Error {
  constructor(readonly code: IllegalActionCode) {
    super(code)
    this.name = 'IllegalActionError'
  }
}

export class PlacementRejectedError extends Error {
  constructor(readonly code: PlacementErrorCode) {
    super(code)
    this.name = 'PlacementRejectedError'
  }
}
