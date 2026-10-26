import { parseArgs } from 'node:util'
import { defaultRules, defaultSettings, runSimulation, seededRandom } from '../shared/game'
import type { AiLevel, Rules } from '../shared/game'

const isAiLevel = (value: string): value is AiLevel => value === 'easy' || value === 'medium'

const { values } = parseArgs({
  options: {
    matches: { type: 'string', default: '200' },
    teal: { type: 'string', default: 'medium' },
    orange: { type: 'string', default: 'medium' },
    seed: { type: 'string' },
    actions: { type: 'string', default: String(defaultSettings.actionsPerTurn) },
    rules: { type: 'string', default: '{}' },
  },
})

const teal = values.teal
const orange = values.orange
if (!isAiLevel(teal) || !isAiLevel(orange)) {
  throw new RangeError('AI levels are easy or medium')
}
const actionsPerTurn = Number(values.actions)
if (actionsPerTurn !== 1 && actionsPerTurn !== 2) {
  throw new RangeError('Actions per turn are 1 or 2')
}
const ruleOverrides: Partial<Rules> = JSON.parse(values.rules)

const report = runSimulation(Number(values.matches), {
  levels: { teal, orange },
  random: values.seed === undefined ? Math.random : seededRandom(Number(values.seed)),
  settings: { ...defaultSettings, actionsPerTurn },
  rules: { ...defaultRules, ...ruleOverrides },
})

console.log(JSON.stringify(report, null, 2))
