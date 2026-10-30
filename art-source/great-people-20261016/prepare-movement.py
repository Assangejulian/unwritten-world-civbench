"""Slice generated walk cycles without changing their painted poses."""
from pathlib import Path
from PIL import Image
import hashlib
import json
import shutil

root = Path(__file__).resolve().parents[2]
archive = Path(__file__).resolve().parent
generated = Path('C:/Users/Lenovo/.codex/generated_images/01a130b5-0423-7c70-a57b-6ce0a1e7306c')
groups = [
    ('command', 'exec-c0ec72ec-a0b6-4420-90b0-dbca97866848.png', ['general', 'admiral', 'engineer']),
    ('scholars', 'exec-17a9005b-d1f2-4c63-bdc2-033a812fcaa8.png', ['scientist', 'merchant', 'prophet']),
    ('culture', 'exec-d09e80f5-00a0-4aa5-9241-8caa57405d25.png', ['writer', 'artist', 'musician']),
]
manifest = {'framesPerClass': 4, 'frameSize': 256, 'baseline': 225 / 256,
            'style': 'Original painted walk/oar phases; fixed scale per class', 'sources': {}, 'classes': {}}

def gap(mask, nominal, axis, span):
    limit = mask.width if axis == 'x' else mask.height
    values = []
    for value in range(max(1, round(nominal - span)), min(limit - 1, round(nominal + span))):
        line = mask.crop((value, 0, value + 1, mask.height) if axis == 'x' else (0, value, mask.width, value + 1))
        values.append((sum(line.histogram()[1:]), abs(value - nominal), value))
    return min(values)[2]

for group, filename, classes in groups:
    source = generated / filename
    target = archive / (group + '-movement-original.png')
    if not target.exists():
        shutil.copy2(source, target)
    image = Image.open(target).convert('RGBA')
    mask = image.getchannel('A').point(lambda a: 255 if a >= 48 else 0)
    ys = [0] + [gap(mask, image.height * i / 3, 'y', image.height / 3 * .08) for i in [1, 2]] + [image.height]
    manifest['sources'][group] = {'file': str(target.relative_to(root)).replace('\\', '/'),
                                  'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'size': image.size}
    for row, cls in enumerate(classes):
        row_mask = mask.crop((0, ys[row], image.width, ys[row + 1]))
        xs = [0] + [gap(row_mask, image.width * i / 4, 'x', image.width / 4 * .08) for i in [1, 2, 3]] + [image.width]
        crops, rectangles = [], []
        for column in range(4):
            rect = (xs[column], ys[row], xs[column + 1], ys[row + 1])
            cell = image.crop(rect)
            bounds = cell.getchannel('A').getbbox()
            assert bounds, (cls, column)
            crops.append(cell.crop(bounds))
            rectangles.append({'rect': rect, 'bounds': bounds})
        scale = min(224 / max(c.width for c in crops), 210 / max(c.height for c in crops))
        sheet = Image.new('RGBA', (1024, 256))
        for index, crop in enumerate(crops):
            crop = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.Resampling.LANCZOS)
            sheet.alpha_composite(crop, (index * 256 + (256 - crop.width) // 2, 225 - crop.height))
        runtime = root / 'web/assets/great-people' / (cls + '-move.webp')
        sheet.save(runtime, 'WEBP', lossless=True, method=6)
        manifest['classes'][cls] = {'file': 'great-people/' + runtime.name, 'sourceGroup': group,
                                     'crops': rectangles, 'scale': scale,
                                     'sha256': hashlib.sha256(runtime.read_bytes()).hexdigest()}

(archive / 'movement-manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf8')
print('Prepared nine four-frame movement sheets with original sources and hashes')
