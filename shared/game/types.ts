export type Team = 'teal' | 'orange'
export type Shape = 'square' | 'triangle' | 'diamond'
export type Facing = 'N' | 'E' | 'S' | 'W'
export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'
export type RotationSide = 'left' | 'right'

export type Cell = { x: number; y: number }
export type Vector = { dx: number; dy: number }

export type Piece = {
  id: string
  team: Team
  shape: Shape
  cell: Cell
  facing: Facing
}

export type PiecePlacement = {
  shape: Shape
  cell: Cell
  facing: Facing
}

export type Ball = {
  cell: Cell
  holderId: string | null
}

export type DeflectionBehavior = 'catch' | 'deflect' | 'rebound'

export type MoveDirections = 'orthogonal' | 'all'

export type Rules = {
  moveDirections: MoveDirections
  maxMoveDistance: number
  boardLength: number
  boardWidth: number
  goalWidth: number
  dieFaces: readonly number[]
  shootBonus: number
  kickConeOnly: boolean
  shootTowardGoalOnly: boolean
  tackleEnabled: boolean
  tackleMinimumRoll: number
  protectAfterTackle: boolean
  edgeBounce: boolean
  shapeBehavior: Record<Shape, DeflectionBehavior>
}

export type ActionsPerTurn = 1 | 2

export type MatchSettings = {
  actionsPerTurn: ActionsPerTurn
  secondsPerAction: number | null
  goalsToWin: number
  maxTurns: number
}

export type Phase = 'placement' | 'playing' | 'finished'
export type MatchResult = Team | 'draw'
export type TurnEndReason = 'manual' | 'noActionsLeft' | 'timeout' | 'goal'
export type KickKind = 'pass' | 'shoot'
export type RollKind = KickKind | 'tackle'

export type MoveAction = { kind: 'move'; pieceId: string; to: Cell }
export type RotateAction = { kind: 'rotate'; pieceId: string; side: RotationSide }
export type KickAction = { kind: KickKind; pieceId: string; direction: Direction }
export type GameAction = MoveAction | RotateAction | KickAction

export type EventPayload =
  | { type: 'placed'; team: Team }
  | { type: 'moved'; pieceId: string; from: Cell; to: Cell }
  | { type: 'rotated'; pieceId: string; facing: Facing }
  | { type: 'blocked'; pieceId: string; at: Cell }
  | { type: 'ballPickedUp'; team: Team; at: Cell }
  | { type: 'ballCarried'; team: Team; from: Cell; to: Cell }
  | { type: 'tackled'; team: Team; at: Cell }
  | { type: 'tackleFailed'; team: Team; at: Cell }
  | { type: 'tackleRefused'; team: Team; at: Cell }
  | { type: 'dieRolled'; team: Team; kick: RollKind; value: number }
  | { type: 'ballKicked'; team: Team; kick: KickKind; from: Cell; direction: Direction; distance: number; path: Cell[] }
  | { type: 'ballDeflected'; at: Cell; behavior: 'deflect' | 'rebound' }
  | { type: 'ballBouncedOffEdge'; at: Cell }
  | { type: 'ballCaught'; team: Team; at: Cell; intercepted: boolean }
  | { type: 'ballStopped'; at: Cell }
  | { type: 'goal'; team: Team }
  | { type: 'turnEnded'; team: Team; reason: TurnEndReason }
  | { type: 'matchEnded'; result: MatchResult }

export type EventAudience = Team | 'all'

export type MatchEvent = {
  id: number
  turnNumber: number
  audience: EventAudience
  payload: EventPayload
}

export type MatchState = {
  rules: Rules
  settings: MatchSettings
  phase: Phase
  pieces: Piece[]
  kickoffPieces: Piece[]
  placedTeams: Team[]
  ball: Ball
  tackleProtectedTurn: number | null
  score: Record<Team, number>
  startingTeam: Team
  activeTeam: Team
  actionsLeft: number
  turnNumber: number
  result: MatchResult | null
  events: MatchEvent[]
  nextEventId: number
}

export type RandomSource = () => number
