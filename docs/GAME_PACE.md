# Game pace

Game pace controls development costs per economic round. It is independent of the realtime playback rate and of a model's response time.

| Key | Label | Development speed | Cost factor | Default score limit |
| --- | --- | --- | --- | --- |
| `blitz` | 极速 | 4x | 0.25 | 163 |
| `online` | 联机 | 2x | 0.5 | 325 |
| `quick` | 快速 | 1.5x | 2/3 | 433 |
| `standard` | 标准 | 1x | 1 | 650 |
| `epic` | 史诗 | 2/3x | 1.5 | 975 |
| `marathon` | 马拉松 | 1/3x | 3 | 1950 |

Standard remains the New Game default. Score limits can be overridden, including 200 rounds. A shorter limit does not itself accelerate development. Pace is saved with the world and cannot be switched by changing realtime playback speed.

The shared factor applies to technology/civic costs, production, gold purchases and upgrades, population food capacity, great-person thresholds, era periods, and existing scaled religious costs. Encounter rewards and scheduling now also support factors below one. Movement allowance, attack strength, yields per round and action count are not multiplied. Existing fixed-duration mechanics retain their rules; this is not a promise that every balance parameter exactly reproduces Civilization VI.

`blitz` is a custom testing option. The other named modes follow the familiar Civilization-style progression, with this game's own standard costs and 650-round baseline. See the [Civilization VI manual](https://downloads.2kgames.com/civilization/vi/manuals/eu/CIV_VI_25TH_ONLINE_MANUAL_ENG.pdf) for the distinction between game pace and playback speed.

MCP `game_session` and summary observations expose `gameSpeed` and `pace`. Players still make every decision; fast pace does not execute turns automatically.

Validation: `node scripts/game-pace-check.mjs` checks costs at equivalent normalized ages, rounding, growth, eras, great people, encounters, unchanged movement, save restore, custom limits and projected ownership counts. `node scripts/mcp-lobby-ui-check.mjs` checks the real setup dropdown and all six score-limit presets.
