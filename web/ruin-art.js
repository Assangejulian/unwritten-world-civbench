// Authored explorable ruins, loaded once per renderer when first encountered.
const images = new WeakMap();
export function drawRuin(renderer, context, tile, point, zoom = renderer.zoom) {
  if (!tile.ruin || tile.hidden) return null;
  let image = images.get(renderer);
  if (!image) {
    image = new Image();
    images.set(renderer, image);
    image.onload = () => {
      renderer.ruinArtReady = true;
      // Both renderers repaint once when the viewport-requested art arrives.
      renderer.dirty = true;
    };
    image.onerror = () => { renderer.ruinArtError = true; };
    image.src = '/assets/scenery/ancient-ruins-v1.webp';
  }
  if (!image.complete || !image.naturalWidth) return null;
  const width = 40 * zoom, height = width * image.naturalHeight / image.naturalWidth;
  context.save();
  if (tile.visible === false) context.globalAlpha *= .62;
  context.drawImage(image, point.x - width / 2, point.y - height * .82, width, height);
  context.restore();
  return {source: image, key: tile.visible === false ? 'remembered' : 'visible'};
}
