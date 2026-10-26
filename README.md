# Dektivo

A turn-based, two-player tactical football game with hidden information, mixing Battleship-style deduction, board-game positioning and arcade mini-football. You play against a local AI (easy or medium), in the browser, on a phone held in landscape or on a computer.

## Run it

Requires Node 22+ and pnpm.

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm test` | Rule engine and AI tests (Vitest) |
| `pnpm typecheck` | Type checking of the app and the engine |
| `pnpm generate` | Static build in `.output/public` |
| `pnpm verify` | Typecheck, tests and static build |
| `pnpm simulate` | AI-vs-AI matches with per-turn statistics (see below) |

## Layout

- `shared/game` — the rule engine, framework-free TypeScript: state, actions, ball trajectories, turns, per-player views, deduction markers and the AI. It never imports Vue, so a server can reuse it unchanged.
- `shared/game/rules.ts` — every tunable rule and match setting.
- `app/` — the Nuxt interface (single-page, no server rendering): pages, Pinia stores, the pitch, radial menus, HUD and log.
- `i18n/locales` — French (default) and English strings.

The AI only receives `buildView(state, team)`, the same filtered view a human player sees, so it never reads hidden opponent positions.

## Provisional rules

These are first-version hypotheses, all adjustable in `shared/game/rules.ts`.

- **Pitch**: 9 columns long by 7 rows wide, shown in landscape. Goals are 3 cells wide, centred on each end line. Teal defends the left goal, orange the right one.
- **Teams**: one square, one triangle and one diamond each, placed secretly in your own half (the midline column stays empty). The ball starts in the centre.
- **Turn**: 1 or 2 actions (2 by default). The turn ends when actions run out, when the timer of the current action expires, or on "End turn".
- **Move**: one or two cells in a straight line, in any of the eight directions, never through a teammate. Crossing a loose ball picks it up; the carrier takes the ball along. Meeting a hidden opponent stops the piece just before it, costs the action and is reported to the mover only. Running into or through the ball carrier is a tackle: the piece stops just before the carrier and rolls the die, and a 2 or 3 steals the ball. The new carrier cannot be tackled during the next opponent turn.
- **Rotate**: a quarter turn left or right.
- **Pass and shoot**: only the carrier, only toward the three directions of its facing cone. A shot must also head toward the opponent goal. The die (1, 1, 2, 2, 3, 3) gives the pass distance; a shot travels die + 2 cells.
- **Collisions**, resolved cell by cell: a teammate always controls the ball. An opponent square catches it, an opponent triangle sends it the way it faces, an opponent diamond sends it straight back. Side lines and end lines outside the goal mouth bounce the ball.
- **Goal**: the ball crosses the end line inside the goal mouth. Everyone returns to their starting cells, the ball goes back to the centre and the conceding team plays.
- **End**: first to the chosen number of goals (3 by default), otherwise the score after 40 turns.
- **Hidden information**: the ball position is public, so a ball carrier is visible as a ball on a cell; opponent pieces, their shapes and orientations are never sent to the other side. Deflections and interceptions are public events with their cell, never the shape.

## Logs and balancing

- A match in progress is saved in the browser and resumes after a reload, from the home screen or the match page.
- At the end of a match, the end screen and the match log offer the full record as JSON: settings, rules, both formations, a per-team summary and every event, hidden ones included.
- `pnpm simulate` plays AI-vs-AI matches and prints the average turns and goals, the results and per-turn rates (moves, blocked moves, passes, shots, interceptions, tackles won, missed or refused). Options: `--matches 200`, `--teal easy|medium`, `--orange easy|medium`, `--actions 1|2`, `--seed 1` for a reproducible run, and `--rules '{"tackleMinimumRoll":1}'` to try a rule change.

## Not there yet

Crowd animations and sound, an installable PWA, a hard AI with rule balancing, and online play with Supabase are the next lots.
