# Gobble Dash — Farmyard to Kitchen Escape

A Thanksgiving escape game: you are the turkey, and Thanksgiving dinner is
coming. Outrun the farmer across the farmyard, hide in the haystacks of the
barn, and slip past the roaring oven and the carving knives of the kitchen —
1800 metres to freedom.

[![bounty](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/irwan11795/makefun-turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/irwan11795/makefun-turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

## How to play

Run with `node serve.ts` and open http://localhost:8080/ — or open
`game/index.html` from any static server. Keyboard and mouse, no network
needed: every script, sound and picture is a local file.

- **SPACE / ↑ / click** — jump (hold for a higher hop)
- **SHIFT / X / right-click** — dash, a burst of speed that outruns the farmer
- **↓ in a haystack** — hide and break the farmer's line of sight
- **P** — pause, **R** — restart

## The escape

Three stages, each harder than the last:

1. **Farmyard** — jump fences and hay bales, dodge falling carving knives,
   grab corn for points while the farmer patrols with his vision cone.
2. **Barn** — darker, tighter; hide in the haystacks when the farmer spots
   you, and watch for rolling pins.
3. **Kitchen** — the oven bursts flame on a timer, knives fall thicker, and
   the farmer chases harder. Reach 1800 m and you are free.

The farmer patrols, spots you with a "!" and an alarm, chases, and searches
when he loses you. Get caught — or run out of your three hearts — and it is
"CAUGHT!". Make it to the end and it is "ESCAPED!".

## Credits

All art is original vector drawing on canvas, all sounds are synthesized
live with WebAudio (gobbles, alarms, oven whooshes, a plucked autumn tune).
Built for the make.fun "Make the best turkey escape game" bounty.

## Screenshots

The four screenshots in `screenshots/` are real renders of this game in
headless Chromium, taken through deterministic `?shot=…&seed=1` scenes
(`scripts/take-shots.mjs`): `1-play.jpg` is the cover — a mid-chase farmyard
run with the HUD — then the title screen, the kitchen stage, and the
"CAUGHT!" end screen with its restart prompt.
