# Climate raster artwork, 2026-10-29

Generated with the built-in imagegen tool, one call per asset, without the fallback CLI. The seven sprites requested true transparency and retain their generated alpha. Source PNGs live beside this file; source/runtime hashes and original dimensions are in [manifest.json](manifest.json). Runtime assets are in `web/assets/climate/`: seven 320px sprites and one 1200px-wide overview, 430,502 bytes in total. Runtime conversion uses Sharp WebP encoding; no new image content was synthesized during conversion.

The actual map consumes the weather and dam sprites. The user-selected r14 climate panel retains its native SVG composition; `world-climate` is optional artwork, not a required panel backdrop. These are original generated assets, not extracted Civilization textures. The contact sheet and browser raster checks are task-local evidence under `output/climate-20261029/`.

## Overview prompt

`world-climate` (opaque):

> Create one wide 3:2 landscape painted illustration for the existing Renaissance/engraved-atlas civilization strategy game Unwritten World. No text, no labels, no border, no UI, no collage panels. A single continuous isometric miniature world seen from a gently elevated strategy-camera angle: a broad meandering river with a historically plausible stone flood-control dam in the foreground, a small red-roof Renaissance town on a safe rise, grain fields and forests, distant smoky early industrial chimneys fading into dramatic weather. On one side warm ochre dry land and dust haze, on the other distant blue snow mountains and a cloud storm over the sea. Beautiful tactile oil/gouache impasto and finely painted carved miniature buildings, restrained parchment ochre, lacquer umber, lapis blue, verdigris green, warm brass highlights. Atmospheric and sophisticated, readable at small sizes. Lower left should have a calm dark-toned area usable as illustration crop, no embedded lettering. This is a real game raster background asset, not a screenshot or UI mockup.

## Weather prompt set A

Each full prompt substitutes one subject below into this template. All requested `transparent_background: true`.

> Create ONE isolated transparent-background game sprite texture: {subject} Style: finely painted oil/gouache miniature matching a Renaissance historical civilization map, soft organic edges and subtle brush texture, subdued parchment-era colors, readable at 128px. Square canvas with centered horizontal composition, 15% transparent margin all sides. Absolutely no text, no frame, no UI, no grid, no hexagonal border, no opaque rectangular background. This is a compositing asset; preserve real alpha transparency and let fine mist/foam fade naturally into it.

| Key | Subject |
| --- | --- |
| blizzard | A low sweeping curl of cold gray-blue storm cloud with fine white windblown snow, seen obliquely from an elevated isometric strategy-game camera. Snow streaks trail toward the lower right. |
| duststorm | A broad ochre and sienna dust storm rolling low over the ground, a curling semi-transparent billowing dust cloud with fine windblown sand trailing right, seen obliquely from an elevated isometric strategy-game camera. |
| flood | A low irregular patch of rushing muddy turquoise river floodwater, with gentle white foam curls and ripples, seen from an elevated isometric strategy-game camera. No houses, no trees, no fixed terrain or riverbanks; just the water surface flowing toward the right. |

## Weather and building prompt set B

Each full prompt substitutes one subject below into this template. All requested `transparent_background: true`.

> Create ONE isolated game sprite on a genuinely transparent background. Subject: {subject} Match a historical Renaissance civilization strategy game's tactile oil/gouache miniature art, refined hand-painted brush texture, earthy stone and muted lapis/umber palette. Centered square canvas, transparent margin at least 15% on all sides, readable down to 96 pixels. Soft natural edges where appropriate. No text, frame, logo, UI, labels, montage, grid or opaque background. Intended as a real raster game asset composited over the existing map.

| Key | Subject |
| --- | --- |
| hurricane | A compact spiraling tropical hurricane cloud seen from above at an elevated isometric angle, with a readable dark eye, gray-lapis curved cloud bands and a few soft rain streaks underneath. No ground or ocean background. |
| eruption | A compact dark charcoal volcanic ash plume with a few glowing burnt-orange embers and low lava glow beneath, viewed from an elevated isometric strategy camera. A low mound of volcanic rock may anchor the base; no surrounding landscape. |
| drought | A small low patch of desiccated ochre earth with organically cracked clay, three sparse tufts of wilted grass and a subtle heat-haze wisp. Viewed from an elevated isometric strategy camera, irregular feathered organic outline; no opaque square or hexagonal platform. |
| dam | A miniature historical stone river dam with three broad arches, restrained pale limestone, a small bronze sluice gate, a short fall of turquoise water and a hint of a timber service walkway, viewed from an elevated isometric civilization-game camera. A single free-standing compact structure, no surrounding terrain or square pedestal. |
