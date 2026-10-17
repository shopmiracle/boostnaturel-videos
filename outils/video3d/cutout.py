"""Détoure un packshot sur fond blanc (remplissage depuis les bords) -> PNG transparent recadré.
Usage : python3 -I cutout.py <photo.jpg> <sortie.png>"""
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

src = Image.open(sys.argv[1]).convert("RGB"); a = np.asarray(src).astype(int); H, W = a.shape[:2]
near = a.min(axis=2) >= 246  # seuil strict : le blanc du sachet n'est pas relié au fond
bg = np.zeros((H, W), bool); q = deque()
for y in range(H):
    for x in range(W):
        if (y in (0, H - 1) or x in (0, W - 1)) and near[y, x]: bg[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
        if 0 <= ny < H and 0 <= nx < W and near[ny, nx] and not bg[ny, nx]: bg[ny, nx] = True; q.append((ny, nx))
assert 0.05 < bg.mean() < 0.8, f"détourage suspect (fond = {bg.mean():.0%})"
alpha = Image.fromarray(((~bg) * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.2))
out = src.copy(); out.putalpha(alpha); out.crop(alpha.point(lambda v: 255 if v > 20 else 0).getbbox()).save(sys.argv[2])
