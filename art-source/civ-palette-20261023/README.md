# Civilization palette provenance

Universe supplied palette-v7.json and the CIEDE2000/color-vision simulation tools. Runtime source is src/civ-colours.mjs. Codex added an explicit player-ID tie-break to the greedy assignment and kept it in this generator.

Optional regeneration requires Python and NumPy, and is not a game dependency:

```powershell
python art-source/civ-palette-20261023/mkmod.py
```

The recorded v7 minimum combined two-tone distance is approximately 14.5 under the author's normal/deuteranopia/protanopia simulation. It is a numeric design aid, not a guarantee of accessibility for every user or display. Old saves preserve their original primary colors.
