# Player interaction and command feedback

The shared command entrypoint displays pending state on the initiating button, coalesces identical in-flight requests and reports the refreshed result. A failure restores retry behavior and shows the server's error. Existing toasts use the browser top layer so a modal cannot hide success or failure messages. Observers retain their existing read-only boundary.

| Flow | Feedback |
| --- | --- |
| Diplomacy with built-in opponents | Immediate acceptance or rejection using the existing court assessment; no economy round is advanced |
| Diplomacy with humans or external agents | Pending until the recipient explicitly answers; no decision is fabricated |
| City production | Pending submission, current-project mark and disabled repeat confirmation in the workshop and inspector |
| Research | New worlds start without a science target; Code of Laws remains the opening civic; saved targets are preserved |
| Mouse input | Both buttons select units; desktop movement and attack targeting require the right button; dragging remains camera movement |
| Panel closing | Shared close commands also dismiss the Universe research and civic codex |

UI sounds are short, quiet sine notes with softened attacks and decays, separate from simulation playback. There is no hover sound. Clicks are rate-limited; UI and world voices share the six-voice bound. Muting, zero effects volume and hidden-document handling remain authoritative. Existing streamed music, soundtrack previews, credits and effect assets are unchanged. These choices avoid additional downloads and sample decoding for interface feedback.

`npm run check:interaction` checks fresh versus saved research, immediate native court decisions, explicit human/agent consent, private cooldowns and single-payment trades. `npm run check:interaction-ui` uses an isolated real player page and HTTP host for pending and confirmed production, modal-safe receipts, rejection errors, duplicate requests, player-selected research, left/right input and actual Web Audio mute/volume behavior. Diplomacy/governor, sequential-turn, tree-interaction and soundtrack-preview regressions provide additional coverage. This is focused verification, not a claim that every command in every era received a manual playtest.
