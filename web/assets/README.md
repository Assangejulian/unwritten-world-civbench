## Current transport artwork (2.0.0)

`transports-painted-v2.png` is a newly generated 1536 x 1024 RGBA atlas with sixteen transparent painted hulls: four idle/four rowing wooden boats and four idle/four underway industrial cargo boats. All face right and share a consistent waterline and scale. Generated with the built-in OpenAI imagegen tool on 2026-10-05, using the original galley-painted-v3.png only as a style reference. The game composites each existing land unit on deck, masks feet/vehicle tracks behind the foreground rail, and preserves existing embarkation/combat/ocean rules. No additional game unit is created.

The exact generation request, original output location, selected hash, frame layout and renderer validation are in `transports-painted-v2-prompt.txt` and `transports-painted-v2-manifest.json`. Preview: `output/playwright/painted-transport-review.png`; evidence: `output/playwright/realtime-ui-checks.json`. All 560 unit action poses from 1.8 remain selected; paragraphs below describe historical art stages.

# Unit atlas

## Current complete art audit (1.8.0)

All 28 map unit types use 20 painted poses each: four idle, eight locomotion, eight attack or civilian work. Twenty-five new original built-in ImageGen sheets (`*-painted-v3.png`) replace the old articulated-only 24 types and the inconsistent archer attack override. Knight, tank and battleship retain their v2 drawings. Original menu portraits and historical candidates remain preserved. Source-facing metadata, normalization, filenames and SHA-256 hashes are recorded in `complete-art-audit-manifest.json`.

The 20-cell `terrain-biomes-v2.png` is original ImageGen artwork, with two flat and two hillside materials for grass, plains, desert, tundra and snow. Its uneven grid was measured as x=[0,273,561,848,1122], y=[0,263,524,797,1073,1402]; runtime crops exclude five pixels at each edge. The shader mirrors/warps samples and blends variants continuously. Grass hills retain grass; snow hills retain snow. Existing generated rock/forest surfaces and licensed water textures remain in use. No commercial Civilization textures were extracted.

Exact generation prompts, background cleanup and relayout corrections are in `output/imagegen/complete-art-audit/generated.json`. The terrain composition reference was the [official Civilization VI manual](https://cdn.steamstatic.com/steam/apps/289070/manuals/CIV_VI_25TH_ONLINE_MANUAL_ENG.pdf) and the [terrain/hills catalogue](https://www.civilopedia.net/en-US/gathering-storm/concepts/world_1/); these are reference links, not redistributed commercial assets.

Runtime changes include shared foot anchors, body-aware size calibration, reflection without turn squashing, civilian work poses, era-specific projectiles and release timing. Iron cannonballs are native shaded geometry; modern shells, stones, arrows and impacts use the original generated combat atlas. Hurt/death remain short effects, not newly painted sheets. Current verification is `output/playwright/complete-art-audit-checks.json`; earlier four-type descriptions below are historical.

File: `unit-atlas.png`. Generated with the built-in ImageGen tool on 2026-10-03. This is an original image atlas, not extracted from Civilization. The game draws national flags separately in civilization colors.

Five columns, four rows, read left to right:

1. settler, builder, scout, warrior, archer
2. spearman, swordsman, horseman, catapult, crossbow
3. knight, musket, cannon, tank, galley
4. frigate, missionary, rifleman, bombard, destroyer

## Generation prompt

Use case: stylized-concept. Asset type: a single production sprite atlas for an original civilization strategy game, to be mapped onto 3D billboard sprites. Generate a large 5-column by 4-row atlas, exactly 20 separate sprites arranged at identical equally spaced cell centers, each entire sprite strictly contained within its own cell with ample transparent margins. Transparent background and transparent gaps between cells, no terrain tiles, no platforms, no outlines, no text, no labels, no watermarks, no UI, no flags, no national colors. Every sprite is a charming detailed semi-realistic stylized 3D strategy-game miniature viewed from an elevated three-quarter angle about 40 degrees, soft warm light from upper left, natural muted materials, hand-painted textures, readable silhouettes. Standing people are small squads of 2 or 3 people, horses and vehicles recognizable, consistent scale and ground baseline. Read left-to-right, top-to-bottom: Row 1: settler family with backpack and rolled blankets; builder team carrying hammer and pickaxe; hooded scout with telescope and travel cloak; ancient warrior squad with clubs and round wooden shields; archer squad holding longbows. Row 2: ancient spearmen with long spears and bronze shields; swordsmen in metal armor with swords and shields; light horsemen on brown horses; wooden wheeled catapult with throwing arm; crossbowmen holding crossbows. Row 3: armored mounted knights with lances; renaissance musketeers with long muskets; wheeled field cannon and crew; olive green modern tank; ancient wooden galley with oars and one square sail. Row 4: wooden frigate with three masts and cream sails; robed missionary carrying staff and book; industrial riflemen with bolt action rifles; wheeled renaissance bombard cannon; steel modern destroyer warship. Make each miniature occupy about 70% of cell width/height with no overlap. The atlas should be approximately square and high resolution for 5 by 4 sprites. Preserve true alpha transparency everywhere except the 20 subjects.

## Rendering

The original PNG and its alpha channel are preserved. DOM unit portraits use matching CSS background positions. The map renderer now derives cached articulated 2D frames from each original cell; it does not modify the source PNG. The units remain sprites positioned against 3D terrain.

## Terrain materials

`terrain-materials.png` is an original 1536 x 1024 image generated with the built-in ImageGen tool on 2026-10-03. It contains six material cells in a 3 x 2 atlas. All six cells are sampled as RGB surface textures by the game. The original atlas is preserved unchanged.

| Atlas cell | Rendered surfaces |
| --- | --- |
| Top left: grass | Grassland and the grassy portion of forest transitions |
| Top center: dry meadow | Plains, with a contribution to tundra |
| Top right: rock | Mountain ground and mountain faces; also supplies mountain bump detail |
| Bottom left: sand | Desert ground |
| Bottom center: forest floor | Ground beneath forests and jungles, blended with the base terrain |
| Bottom right: snow | Snowfields, a contribution to tundra, and snow caps on mountain faces |

Ground textures use continuous world coordinates. Adjacent hexes share interpolated material weights for soft transitions. Explicit texture gradients prevent false seams caused by mip sampling at atlas wrap boundaries. Mountain faces use triplanar rock textures and height-blended snow textures. Fog dims explored surfaces, and unexplored tiles have zero material weights. Vegetation retains its procedural geometry and colors.

Actual GPU validation is recorded in `output/playwright/terrain-material-checks.json`: temporarily changing each atlas cell changes rendered pixels on the corresponding terrain, then restores the source texture. This verifies actual texture use beyond loading the image file. Fullscreen desktop rendering and byte-exact preservation of the current save are also checked. Screenshots are in `output/playwright/terrain-materials-world.png` and `output/playwright/terrain-materials-native.png`.

Generation brief: seamless, overhead, hand-painted natural terrain materials for an original sunlit civilization strategy game. Grass with fine blades and earthy flecks, dry meadow, stratified stone, sand, dark forest floor, and snowy rock. No hexagons, platforms, objects, buildings, text, UI, or Civilization artwork.

## Public building models

The following packs are distributed by Kenney under CC0. Their original `License.txt` files and unmodified model sources are retained in each folder.

- **Fantasy Town Kit 2.0**: https://kenney.nl/assets/fantasy-town-kit — `fantasy-town-source/`. Windowed walls, doors, tiled roofs, chimneys, fountain, and carts are assembled into towns and districts.
- **Castle Kit**: https://kenney.nl/assets/castle-kit — `castle-kit-source/`. Towers, keeps, and ramparts are assembled into city walls and civic architecture.

The game adds original procedural landmark geometry, farmland, and roads. Road ribbons are decorative connections between actual cities, districts, and trade routes; they do not grant an additional movement bonus. Model parts are spatially batched using `InstancedMesh` for visibility culling. Three.js and its bundled GLTF loader retain the upstream MIT license in `web/vendor/three/LICENSE`.

No commercial Civilization assets are included. The user-provided reference screenshot is a visual reference and is not distributed as a game texture.

## Facility and district atlas

`facility-atlas.png` is an original 1536 x 1024 RGBA image generated with the built-in ImageGen tool on 2026-10-03. It is bundled locally and used by the actual 3D map renderer. Six columns and four rows, read left to right:

1. farm, pasture, camp, plantation, mine, quarry
2. fishery, well, lumbermill, campus, library, university
3. lab, holy, shrine, temple, industrial, workshop
4. factory, powerplant, commercial, bank, harbor, theater

The renderer detects each sprite's connected alpha bounds, including chimney tips that extend across nominal atlas cells, and uses those bounds as texture UVs. Transparent margins are removed from the displayed quad and separate footprint anchors place the ground area at the tile center. The PNG itself is preserved. These are camera-facing textured planes in the 3D scene, with terrain depth testing and alpha-tested shadows; city centers, wonders, vegetation and roads retain their existing 3D meshes.

Campus appearance progresses through library, university and laboratory. Holy sites progress through shrine and temple. Industrial districts progress through workshop, factory and power plant. Commercial centers display the bank after construction. A visible enemy district exposes its public appearance without exposing its private building list or unseen upgrades.

Generation brief: one transparent 6 by 4 atlas of original painterly architectural miniatures, orthographic view 37 degrees above the horizon, warm upper-left sunshine, Mediterranean stone, timber, tiled roofs and muted vegetation. Each cell depicts the distinct improvement or building listed above; no text, national flags, UI, hexagonal platforms or commercial game assets.

Runtime proof is recorded in `output/playwright/river-facility-checks.json`: each of the 24 cells was recolored temporarily in GPU memory, and its own facility changed real rendered pixels. The original atlas is restored after each probe. The gallery screenshot is an isolated renderer verification fixture, not a modified player save.

## Resource, unit expansion, and water assets (1.4.0)

`resource-atlas.png` is a locally bundled original ImageGen atlas. Four columns and four rows: wheat, cattle, deer, fish; stone, iron, horses, gold; gems, spices, silk, oil; uranium, then three empty cells. Each resource has its own physical scenery, including grazing horses and cattle, deer, fish, crops, plants, and mineral deposits. Alpha bounds preserve disconnected animals. Improved plots use smaller props. City and district plots omit resource scenery. The renderer only receives resources revealed by the selected view; unrevealed deposits and unexplored land remain hidden.

`unit-extra-atlas.png` is an original ImageGen atlas with four columns and two rows: slinger, pikeman, man-at-arms, courser; cuirassier, cavalry, artillery, battleship. Art is used in the actual map, production menu, and unit catalogue. Map selection checks this atlas's own alpha pixels. National flags are rendered separately. All eight types reuse the functional move, attack, hurt, and death animation system with distinct motion profiles.

Generation briefs: transparent original painterly strategy miniatures under warm sunlight, orthographic view about 37 degrees, natural materials, complete silhouettes, no labels, UI, national flags, or commercial game artwork. Resource subjects are natural herds, crops, deposits, and an oil seep; military subjects span ancient infantry, medieval armor, mounted units, modern artillery, and a steel battleship. Assets are not extracted from Civilization VI.

`water-normal.jpg` is the 1024-pixel Water 001 normal map by Katsukagi: https://3dtextures.me/2017/12/28/water-001/ . The creator's license statement at https://3dtextures.me/about/ permits use and redistribution under CC0. Attribution and license links are preserved in `WATER-LICENSE.txt`. Two moving samples drive river ripples and sea highlights. Shallow turquoise water blends gradually into darker offshore water. River channels have variable width, lowered banks, and soft wet-soil edges without continuous bright outlines.

Hashes, dimensions, frame order, and provenance are recorded in `alignment-water-assets.json`. The 24 existing facility sprites now use footprint anchors rather than their image bottom, with widths of 38 or 39 world units. Camera zoom scales every map object consistently.

Validation: `output/playwright/alignment-water-checks.json` proves all 13 resource cells and all 24 facility cells change real GPU pixels, all eight extra units have working alpha selection, resource scenery updates with city occupancy, markers pick their own tiles at three zoom levels, shallow/deep sea pixels differ, and native fullscreen works. The player's turn 80 save is restored byte for byte. Renderer gallery screenshots are isolated test fixtures; their header remains the player's existing UI state.

## Coastal scenery correction (1.4.1)

The old fish atlas cell included a stone-lined pool, which looked like a floating island when shown on the ocean. Its original PNG remains intact for provenance, but this cell is no longer displayed. Fish resources now use three small, translucent silhouettes and faint ripples in the water shader. Their motion and tint follow the water surface, depth, fog lighting, and resource visibility toggle. Fisheries suppress these silhouettes and retain their facility artwork and round fish badge.

All completed improvements suppress the original resource scenery. Quarries, mines, pastures, farms, plantations, and other facilities retain the resource's circular badge. The redundant low-poly stone piles in the terrain layer have been removed; loose stone scenery on unmodified plots uses its existing atlas sprite only. Ruin decoration remains separate.

Coastal triangles carry signed distance to known shoreline segments. A spatial index limits sampling to nearby shore edges. Grass or other land surfaces blend into dry sand, wet sand, and shallow water. Small spatial variation softens the waterline; broken, faint surf avoids a continuous bright outline. Hidden land is excluded from shoreline generation.

These changes use original shader code and existing materials; no new external artwork was downloaded. `output/playwright/coastal-scenery-preview.png` shows an isolated render fixture, without the game UI or a player save. The headless GPU check in `coastal-scenery-preview-checks.json` confirms fish change water pixels, facility/resource suppression, shader compilation, and no errors. No game server or desktop game window was launched.

## Articulated unit animation (1.5.0)

`web/unit-animation.js` defines rigs for all 28 existing types. Leg influences deform a small textured triangle mesh; horse neck motion, rotating wheel patches, tread links, sail and oar deformation, and steam smoke distinguish the locomotion classes. Sixteen frames per type are cached at 128 x 128 pixels, with an additional unmodified idle frame. Frames are warmed in short background batches and shared between units of the same type. No new artwork or runtime dependency was downloaded.

The map applies a heading-dependent reflection, width, and shear to suggest a turn while keeping the figure upright. This retains the original single-view illustration; it is not a set of newly painted rear views or a 3D skeletal model. Wakes, dust, suspension settling, and idle movement are drawn independently. Flags and labels do not inherit sprite transforms. Hit testing inverts the current transforms and samples the animated frame's alpha mask.

Movement events carry the path from the existing movement search. Travel interpolates through its waypoints and follows terrain height; a replacement movement continues from the sampled position. Final headings are retained for the renderer session. Journals, paths, headings, and derived frames are transient; source PNGs and player save formats remain unchanged. Validation uses an isolated fixture with the actual map renderer, without starting the game server or loading a player save.

## Source heading audit (1.5.1)

All 28 original atlas cells were inspected individually. `unit-facing-audit.json` records their source headings, cell coordinates, visual evidence, and source PNG hashes. Knights, settlers, spearmen, missionaries, and galleys use left-facing artwork and now override the previous right-facing default. Tanks, frigates, and destroyers already had the correct left-facing mapping. The other 20 source illustrations retain right-facing or nominal right-facing poses. A raised sword or sling is not used as the sole heading cue for a frontal figure.

The knight's neck deformation follows the left side of its source artwork as well. Rendering tests compare all 28 cropped sprite sources against the independently recorded atlas cells, then exercise east and west movement with the audited heading signs. `output/playwright/unit-facing-audit.png` shows both rendered directions for every type, and `unit-facing-knight.png` shows the corrected knight pair. The Node checks also cover all six map headings. These previews remain isolated from player saves and the desktop game.

## Painted action sheets (1.7.0)

Historical section: as of 2.13.1, the two obsolete archer files below are preserved in `art-source/unit-retired-20261007/`; the current complete v3 archer sheet remains selected. The historical manifest resolves their archived paths. See `DRONE_ART_REVIEW.md` for the all-unit selection audit.

Six original RGBA PNGs were generated with the built-in ImageGen tool on 2026-10-05 and are bundled locally:

| File | Layout | Used frames |
| --- | --- | --- |
| `knight-painted-v2.png` | 4 x 5 | 4 idle, 8 gait, 8 sword attack |
| `archer-painted-v2.png` | 4 x 5 | 4 idle, 8 walk; candidate attacks unused |
| `archer-attack-painted-v1.png` | 4 x 2 | 8 complete full-body bow attack |
| `tank-painted-v2.png` | 4 x 5 | 4 idle, 8 tread movement, 8 gun attack |
| `battleship-painted-v2.png` | 4 x 5 | 4 idle, 8 sailing, 8 salvo attack |
| `combat-painted-v1.png` | 4 x 5 | 20 projectile and effect sprites |

The primary unit sheets use row-major idle 0-3, movement 4-11 and attack 12-19. The archer's complete attack sheet overrides the eight incomplete candidate attack cells in its primary image. All four new sources face right, independently of the historical menu atlases. The original portrait PNGs and their audit hashes are unchanged.

The combat sheet contains: tank shell, naval shell, stone, arrow; four muzzle frames; four ground impact frames; four water splash frames; sword trail, contact sparks, hoof dust and smoke. All cells are used by gameplay animation: existing gun units use generated muzzle flashes while tanks and battleships include flashes in their painted attack poses. Knight attacks use their sword artwork plus a short contact trail and sparks; they never spawn shells.

`web/painted-actions.js` recovers connected silhouettes that extend across nominal cells, including horse feet and overlapping weapon extents. It expands opaque component masks into soft alpha edges, separates neighboring poses, centers on the lower body and uses a shared scale and ground baseline. Source PNGs are preserved byte for byte; aligned canvases and selection masks are cached in memory. All four units use genuinely different drawings, with 16 runtime time slots mapped to the appropriate 4- or 8-pose cycle. Other unit types retain their original articulated rigs.

Exact prompts, including initial and cleanup attempts, are saved in `output/imagegen/painted-actions-prompts.json`. `painted-actions-manifest.json` records the six chosen files, SHA-256 hashes, dimensions, provenance, frame order and verification paths. No commercial game artwork or additional runtime dependency is included. Actual map renderer checks are in `output/playwright/painted-actions-checks.json`; the complete 80-pose gallery and in-map animation GIF are in the same folder. The turn 112 save stayed byte exact and no game window was launched.
