# MCP query and command guide

## Inspecting entities

Use `game_inspect({id: 65})` for a city or unit, or `game_inspect({tile: 269})` for a tile. Pass exactly one selector. Unsupported fields such as `city` are rejected by the MCP schema instead of silently disappearing. A valid selector for an unseen object still returns `not_visible`; this preserves fog boundaries.

## Climate and weather

Use `game_observe({section: "climate"})` for public global warming, rainfall and emissions, your own city contributions/protections, and hazards in permitted geography. Summary includes compact climate conditions; world observations include the same climate projection. Other civilizations are an anonymous aggregate; observer mode alone receives every civilization's aggregate. Remembered terrain does not expose current weather. Climate indices are game abstractions, not measured tonnes or precipitation millimetres.

Legal production and purchase options include dams, reservoirs, flood barriers and clean power when their actual prerequisites are met. Repair options respect coastal inundation. Submit ordinary options through the existing command authority; the climate section itself changes no state. See [Climate and natural disasters](CLIMATE.md) for rules and protection scope.

## Natural wonders

Use `game_observe({section: "natural_wonders"})` for your civilization's discovered sites and discovery reward. `world` includes the same projection; `summary` includes the discovered count. Use `game_rules({kind: "natural_wonder"})` for the public 35-entry real-world catalogue (use `limit: 40` for the complete pool) without map locations. Ordinary map/inspect yields include known local bonuses. Hidden sources provide no aura or identity. See [Natural wonders](NATURAL_WONDERS.md).

## Write tokens

`game_act`, `game_batch` and `game_end_turn` require `observation_token` in their MCP schemas. Fetch it from an observation or options response and use `next_observation_token` after successful commands. Missing tokens return `missing_observation` through the HTTP/runtime interface; an old token returns `stale_observation`. Both reject without applying an action. Request-ID retries still return the recorded result before freshness checks.

## Public rules and counts

`game_rules({kind: "leader", key: "sejong"})` returns public leader mechanics using the world's rules version. It does not expose AI weights or identify which unmet opponents are present. Omit `key` to browse valid keys instead of guessing them.

Summary `counts.ownUnits` and `counts.ownCities` describe this seat. `visibleUnits` and `visibleCities` include other visible owners. Legacy `units` and `cities` retain their visible-count meaning. Observer own counts are null.

## Fewer queries without losing actions

`game_options` accepts `cities: [23, 65]`, `units: [2, 3]` and `item` filters. Array limits are 1–32 IDs. Singular filters remain supported. Read every page using `next` when necessary.

`compact: true` groups otherwise identical production, purchase or faith-recruitment placements:

```json
{"type":"produce","city":23,"item":"campus","tiles":[270,344],"preview":{"turns":8}}
```

Choose one tile and remove `tiles` before submitting:

```json
{"type":"produce","city":23,"item":"campus","tile":270}
```

Different previews are kept separate. `total` and `next` paginate compact rows; `action_total` counts the underlying legal actions. Default responses remain ungrouped. Compact mode does not remove legal destinations or change command validation.

Query the action catalogue once, then filter options and use batches. Read summary tasks before repeatedly querying every fortified unit or every city's unchanged queue. Exact query reductions and billed tokens require measurement; compact output alone is not a cost guarantee.

Summary tasks appear before map metadata, with research, civic, production and other important decisions ahead of routine unit orders. MCP 1.3.1 returns up to 12 tasks by default. `value.tasksPage` reports total, per-kind counts, next and truncated. Use `game_observe({section:"summary", cursor:next, limit:12})` to continue, or `section:"tasks"` for a normal paginated task list. For summary, cursor/limit control the nested tasks; outer total remains 1 because the summary itself is one object. All tasks remain accessible, without hidden information or strategy scores.

Summary `maxTurns` and `pace.maxTurns` both report the actual match limit. `pace.defaultMaxTurns` is the speed preset's default before a custom override; it does not terminate the current match.

`game_options` rejects unknown query fields. Use `city` or `unit`, not `target`. An optional `observation_token` now checks the query against that observation rather than being silently ignored.

MCP responses also include short `observation_ref` or `next_observation_ref` values. Prefer passing that short value in the existing `observation_token` argument, for example `{"observation_token":"oref_ab12cd34_5","action":{"type":"research","item":"mining"}}`. Batch receipts include a reference beside each next token; use the last applicable receipt.

A reference identifies the exact observation originally returned, never whichever state happens to be latest. The host still rejects outdated observations. References are local to that MCP process and civilization binding; they cannot cross a world, seat, or adapter restart. Unknown or evicted references require a new observation. The adapter retains only a bounded recent reference cache, and existing full-token clients remain compatible.

Full observation tokens contain `ot1_` followed by exactly 64 lowercase hexadecimal characters. MCP rejects malformed values before making a game request. To recover, call `game_observe` without an observation token and use the newly returned reference or complete token. A correctly formatted but outdated token still produces `stale_observation`; format validation does not bypass freshness or change request-id retries.

## Great People and elimination

Submit the full activation action returned by options, removing only `preview`. Great Person activation accepts `unit` and its applicable `city`, `targetUnit`, `religion`, or `religionParent` fields. A `tile` field is not an activation target. Ownership, distance and other activation requirements still apply.

Use `game_preview({kind:"settlement", unit:settlerId})` for the existing known-terrain legal-site lens before moving a settler. Failed founding does not imply there are no valid sites; do not replace this public preview with hidden-map searches.

## Standby, voting and connection failures

`fortify` rests/heals for the current turn; it is not a persistent sleep command. `alert` is the existing persistent military standby: it rests now and suppresses routine unit tasks on future turns until a visible hostile unit approaches. `wake` cancels it. It is not available for civilians. Use ordinary 1–32 command batches when placing multiple military units on alert. Batch structure is `commands:[{action:{type:"alert",unit:65}}]`; larger lists require separate batches.

Congress options enumerate support, oppose and abstain, and gain/lose votes for each public eligible leadership target, including every affordable extra-vote count. `preview.favorCost` is paid in `diplomaticFavor`, not gold. Each choice is a quote against the current balance, not a guarantee that multiple paid choices still fit after earlier votes. Native AI recommendations remain separate.

The adapter retries a network-failed event read once, against the same binding and original cursor, with `wait_ms:0`; it does not repeat the full wait. Persistent failures remain visible. Writes are never automatically retried after transport errors because a response may have been lost after applying the action. Observe the current state and use request-ID receipts where applicable before deciding whether to resubmit. A harness's model-provider 429 is outside the game MCP and cannot be fixed by game_events polling.

`game_session.eliminated` and `game_events.eliminated` signal this seat's defeat independently of the global `terminal` winner. An eliminated seat has `yourTurn: false`; event waits return immediately and new writes return `eliminated`. Read access remains available for review. API players stop normally without further model requests or a connection-error warning. A planned round count is not achieved merely because a player was eliminated early.
