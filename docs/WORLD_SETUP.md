# World setup and resource discovery

The New Game screen keeps world options together in the existing desktop layout and mobile World tab. Local play and pending MCP matches pass the same settings to authoritative world creation. Changing an option invalidates a pending match's configuration fingerprint.

| Setting | Choices | Default | Actual effect |
| --- | --- | --- | --- |
| Rainfall | Dry / Standard / Wet | Standard | Changes biome moisture, vegetation and river density; climate rainfall starts at 35 / 50 / 65 and retains that baseline in later rounds. |
| Resource abundance | Sparse / Standard / Abundant | Standard | Retains about 35% / 60% / 100% of the former resource distribution, plus protected starting deposits. |
| Barbarians | Enabled / Disabled | Enabled | Controls camps and barbarian raids. Disabled worlds contain no camps. |
| Natural wonders | Enabled / Disabled | Enabled | Uses the real-world 35-site pool, with map-appropriate placement density. |
| Disaster intensity | Climate off / No disasters / Low / Normal / High / Extreme | Normal | Controls climate settlement and disaster frequency. Rainfall still affects generated geography when climate is off. |

Resource thinning uses a separate deterministic per-tile hash after the original geography, resource, start and river generation. With the same seed, map dimensions, player count, shape and rainfall, abundance presets retain the same terrain, starts, rivers and camps. Sparse deposits are a subset of Standard deposits, which are a subset of Abundant deposits. Starting wheat and the nearby strategic deposit remain protected. Abundant retains the original density; Standard reduces the ordinary deposits by about 40%. Natural wonder candidates can differ because they require resource-free source tiles.

## Technology and map visibility

| Strategic resource | Reveal technology |
| --- | --- |
| Horses | Animal Husbandry (`animal`) |
| Iron | Bronze Working (`bronze`) |
| Oil | Combustion (`combustion`) |
| Uranium | Atomic Theory (`atomic`) |

Bonus and luxury resources currently have no reveal-technology requirement and are visible as soon as their terrain is explored. Human seat views, native-driver observations and MCP projections all use the querying civilization's technology. Another civilization discovering a resource never reveals its location to a seat without that technology.

The global spectator map shows a strategic resource only once at least one civilization has the corresponding technology. Knowledge remains part of the world after that civilization is eliminated. Research reveals deposits on previously surveyed terrain without requiring a second visit; unsurveyed or intelligence-only terrain does not gain fabricated resource knowledge. The 2D map and 3D sprites refresh from the same projected resource field.

Hidden deposits provide no resource yield or resource-specific discovery/improvement boost. A builder may still build an ordinary terrain improvement over an unknown deposit. The deposit stays in the authoritative map and can be extracted after research and the appropriate improvement; hiding never deletes or relocates it.

## Saves and API

Creation options are `rainfall: 'dry' | 'standard' | 'wet'`, `resourceAbundance: 'sparse' | 'standard' | 'abundant'`, and `barbarians: boolean`. New worlds persist the selected values in `settings`. Invalid explicit values are rejected.

Existing saves keep their generated map, deposits and climate state. Loading does not thin resources, regenerate terrain, or insert new generation settings into a legacy save. Missing rainfall settings use the historical Standard climate baseline. Existing worlds receive the corrected resource visibility through current projections.

Run `npm run check:world-options`, `npm run check:world-options-ui` and `npm run check:world-options-native` for isolated rule, real-browser and compiled-driver checks. These checks never write production saves or call paid models.
