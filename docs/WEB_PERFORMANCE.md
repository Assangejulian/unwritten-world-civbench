# Web renderer pacing

The renderer uses `requestAnimationFrame` with a phase-preserving 60 Hz ceiling. It follows slower displays and skips presentation work while the menu or document is hidden. This is a frame-rate limit, not a guarantee of 60 FPS. Authoritative turns, movement costs and AI scheduling remain unchanged.

Camera easing and keyboard pan speed use elapsed time, preserving their previous 30 Hz motion speed on 60/120/144 Hz displays. Active unit positions may refresh at the presentation cadence; original pose artwork and the slower idle, water and trade-route schedules remain intact.

```text
Pointer / keys -> time-based camera -> <= 60 Hz presentation
Game / assets  -> invalidate paint  -> rebuild cached overlay
Small pan      -> shift cached ink -> refresh depth + dynamic units
```

Static annotations and ground ink use a 96 CSS-pixel apron for short pans. Content arrivals, new snapshots, layer/selection/hover changes, zoom and leaving the apron rebuild the cache. City hit regions move with the ink. Ground depth is refreshed with the camera so buildings still occlude units and map highlights correctly. Wrapped multi-copy and large/high-DPI views retain conservative cache bounds. The apron adds a bounded memory cost; resolution, artwork, antialiasing, shadow settings and model complexity are preserved.

The visibility projection remains authoritative. A cached image may not survive a new snapshot or become a source of hidden terrain data. Panning must not rebuild static terrain lighting.

## Validation

Run `npm run check:frames` for deterministic timing and a disposable software-WebGL raster comparison. With a local before-source copy under the ignored audit output, the same test measures baseline and candidate. Without that copy it still checks the current renderer and timing. It covers shifted label bounds, depth recapture and invalidation after content, layers, hover, selection, zoom, long pans and state changes.

Generated timings, raster comparisons and historical before/after results remain local. Run the checks in your own environment; they are not a general hardware performance or mature-game FPS guarantee.

`check:render-review`, `check:lighting-relief`, the pan/task check and map-depth check protect sprite alpha, LRU limits, fog, depth, picking, resized views and wrapped copies. The unit-animation suite checks independent atlas layouts, source/runtime hashes, unit rigs and legal movement/save round trips.

Unbounded prewarming is deliberately absent: first-use sprite lighting can be expensive, and computing every pose at once would move the hitch into loading. A later idle-budget prewarm should be measured separately while preserving the existing LRU limits.
