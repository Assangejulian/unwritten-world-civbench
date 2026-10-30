# Climate and natural disasters

Climate is settled once per complete economic round, in both sequential play and realtime observation. Waiting for a model, reading an observation, rendering a frame and changing playback speed do not advance climate. New worlds enable climate with normal disaster intensity by default. The New Game form offers Off, No natural disasters, Low, Normal, High and Extreme. No natural disasters keeps emissions and warming active.

## Emissions and warming

Each operational city contributes 8 from coal generation or 5 from oil generation, plus 2 from an operational factory. Nuclear generation has no generation emissions. Renewable power reduces the remaining factory contribution to 0.5. Only the highest operational plant in the existing replacement chain contributes; obsolete coal plants do not keep emitting underneath a replacement. Living oil-dependent units contribute 0.25 each economic round.

Clearing a forest contributes 3; clearing jungle contributes 4. Successful builder clearing, founding and district/wonder construction record this once, on successful clearing, and settle it at the next economic round. Historical deforestation is not reconstructed when loading a legacy world.

The emissions ledger records actual round contributions, including cumulative source totals. Atmospheric CO2 load is normalized by the selected development-cost factor so comparable development speeds do not artificially postpone warming. These values are game indices rather than measured tonnes. Carbon capture removes up to `80 / pace.factor` atmospheric-load units per completed project. Capture does not erase the historical emissions ledger or reverse a warming stage already reached.

CO2 load divided by the original number of major civilizations crosses thresholds 150, 350, 600, 900, 1300, 1800 and 2400. The eight stages run from Stable to High-temperature World. Each stage adds 0.4 degrees relative to the starting climate. Sea rise begins at stage 2 and reaches 3 m at stage 7. Low coastal tiles have deterministic game elevation tiers of 1, 2 or 3; the retained map topology and occupied cities are never silently converted into ocean.

Rainfall is a bounded 0–100 index. Its weather variation and warming trend influence the relative frequency of floods and droughts. This is a strategic abstraction, not a physical rainfall or atmospheric circulation model.

New Game also offers Dry, Standard and Wet rainfall presets. Their starting rainfall indices are 35, 50 and 65; the chosen baseline persists under later weather variation and warming. They change biome moisture and river density during map generation, including when climate settlement is disabled. See [World setup](WORLD_SETUP.md) for resources, barbarians and saved-world compatibility.

## Disasters

All weather uses an independent saved RNG. Disaster footprints, movement direction, severity, remaining rounds, recent events and bounded fertility gains survive save/load. Natural generation starts from round 8, respects suitable terrain, and keeps at most four naturally concurrent hazards (the simulation cap is six).

| Disaster | Origin and footprint | Duration | Base damage per affected round |
| --- | --- | --- | --- |
| Flood | Connected flat riverbank tiles | 2 rounds | 12 × severity |
| Drought | Dry land away from polar and mountain terrain | 4 rounds | Food loss, no direct damage |
| Blizzard | Snow and tundra; moving footprint | 3 rounds | 14 × severity |
| Dust storm | Desert; moving footprint | 3 rounds | 10 × severity |
| Hurricane | Water origin, moving water/coastal footprint | 3 rounds | 18 × severity |
| Eruption | Seeded volcanic mountain and surrounding land | 2 rounds | 22 × severity |

Damage affects living units, city/city-state health and exposed improvements, roads, forts and ordinary districts. Severity 3 can remove one population on first impact. Disasters cannot erase a city or its last citizen; great people and carried diplomatic envoys retain one HP instead of bypassing their existing lifecycle rules. Wonders are not destroyed. Floods, dust storms, hurricanes and eruptions can grant a rare permanent yield bonus, capped at two total points per tile.

Drought subtracts two food from an affected worked tile and two from an affected city center. Flooded low coast halves base tile food and production before heritage effects and pillages exposed infrastructure. A barrier protects the city-managed coast, but previously damaged infrastructure still requires a builder repair. Unprotected inundated land cannot be improved, cleared, repaired or used for new districts/wonders. Native planners can replace a stranded coastal queue instead of waiting indefinitely.

## Mitigation and clean power

| Item | Unlock | Placement/prerequisites | Effect |
| --- | --- | --- | --- |
| Dam | Buttress | River in the city's owned radius | Protects city-managed tiles from river flood damage and drought food loss; +3 housing, +1 food |
| Reservoir | Engineering | River in the city's owned radius | Protects city-managed tiles from drought food loss; +2 housing, +2 food |
| Flood barrier | Computers | Low coast in the city's owned radius | Prevents ongoing coastal inundation effects; repairs remain separate |
| Hydroelectric plant | Electricity | Factory and operational dam | +14 production, replaces older plant output, no generation emissions |
| Wind plant | Computers | Factory | +14 production, replaces older plant output, no generation emissions |
| Solar plant | Satellites | Factory | +15 production, replaces older plant output, no generation emissions |
| Carbon recapture | Computers and Conservation | Factory; repeatable project | Removes atmospheric load without reversing prior stages |

These use the game's existing ordinary-building, production, purchase, housing and research-unlock systems. Dams are city buildings with a painted map structure rather than a new independently placed district entity. No fuel-consumption inventory, electrical-demand grid, nuclear-reactor accident, terrain submergence or complete Gathering Storm ruleset is implied.

## Player interface and information

Open **More → Climate**. The panel shows emissions distribution and ledger, eight climate stages, temperature, rainfall and sea level. Missing data remains unavailable rather than fabricated zero. Opening and closing the panel changes no game state.

Own-seat data includes actual city emissions and operational protection. Other civilizations are an anonymous aggregate derived from the public global total. Full observers see every civilization's aggregate contribution. No foreign city/plant inventories, future weather, weather RNG or hidden active footprint is exposed. Live tile weather is omitted from remembered terrain. The world map and city settlement share the same pure yield arithmetic.

MCP supports `game_observe(section: "climate")`; summary and world observations also expose climate. The real stdio SDK check covers this section. All eight native strategies receive view-filtered damage hints and mitigation utility; they can choose prevention and avoid visible damaging weather through the normal legal-action authority.

Weather artwork is loaded lazily for visible footprints, clipped to permitted ground tiles, and supports horizontal map copies. Shared SVG engravings cover new buildings in production and research. Reduced motion remains authoritative; active weather requests at most eight dynamic overlay updates per second and does not change the renderer's static/depth architecture.

Native settlement and district decisions discount explored floodplains, exposed low coasts and known volcanic neighbors. Warming increases coastal risk; active damage is considered only where the player has current visibility or ownership. Natural-site opportunities and soil yields can still justify some exposure; this is a bounded heuristic, not a weather forecast.

All eight native policies compare actual production gained from replacing the currently operational power plant and the resulting local emission change. A higher-ranked plant with identical output and no emission benefit is deprioritized. Carbon removal is deprioritized when atmospheric CO2 is zero. Active floods, droughts and inundation increase relevant local mitigation utility. Builders can repair after a disaster passes; when visible weather threatens their survival, they favor a reachable lower-damage destination over working in place. Existing combat-defense and financial safeguards remain.

Run `npm run check:environment-ai` after `npm run build:players` for actual legal-choice tests across all eight compiled civilizations. When private before-source/binary receipts are available, the script also records decisions from the isolated prior implementation. This tests targeted policy behavior, not improved whole-match win rates or paid external-model performance. External AI harnesses continue to make their own decisions through the same player-visible observations.

## Compatibility and verification

Legacy worlds initialize climate in memory at their current turn; no production save is rewritten by installation. The current save format and existing identity/levy metadata remain supported. Backend rules activate on a normal full game restart. A frontend refresh alone cannot upgrade an already running backend. The public module graph stays compatible with older running servers; unavailable climate data does not abort frontend startup.

Run `npm run check:climate`, `npm run check:climate-native` and `npm run check:climate-ui`. The focused checks cover round settlement, real damage/protection, coastal repair authority, production/purchase, source accounting, projected yields, fog boundaries, exact weather restoration, actual compiled native orders, real HTTP/browser flows, responsive layout and real map raster changes. They do not establish whole-match balance or a hardware FPS guarantee.

Art originals, runtime hashes and prompts: `art-source/climate-20261029/`. Runtime WebPs: `web/assets/climate/`. The selected panel uses native SVG artwork; the generated overview illustration is retained as optional art rather than forced into that composition.

The design is inspired by the environmental systems in the [official Civilization VI: Gathering Storm manual](https://cdn.2kgames.com/manuals/civilization-vi/gathering_storm/2KGMKT_CIV6_Gathering_Storm_PC_Online_Manual_V7_US.pdf). The costs, thresholds, protection scope and topology-preserving inundation above are this game's adaptations.
