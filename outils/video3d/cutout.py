"""Détoure un packshot sur fond blanc -> PNG transparent recadré.
Fond = blanc relié aux bords. Les zones blanches du produit collées au fond sont récupérées
par l'enveloppe convexe du produit (emballages : pots, sachets, boîtes).
Usage : python3 -I cutout.py <photo.jpg> <sortie.png> [--no-hull]"""
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src = Image.open(sys.argv[1]).convert("RGB"); a = np.asarray(src).astype(int); H, W = a.shape[:2]
near = a.min(axis=2) >= 246
bg = np.zeros((H, W), bool); q = deque()
for y in range(H):
    for x in (0, W - 1):
        if near[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
for x in range(W):
    for y in (0, H - 1):
        if near[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
        if 0 <= ny < H and 0 <= nx < W and near[ny, nx] and not bg[ny, nx]: bg[ny, nx] = True; q.append((ny, nx))
fg = ~bg
# ignore les petits points isolés (poussière, ombres) avant l'enveloppe
fg_img = Image.fromarray((fg * 255).astype("uint8")).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))
if "--no-hull" not in sys.argv:
    ys, xs = np.nonzero(np.asarray(fg_img) > 0)
    pts = sorted(set(zip(xs.tolist(), ys.tolist())))
    def cross(o, p, r): return (p[0] - o[0]) * (r[1] - o[1]) - (p[1] - o[1]) * (r[0] - o[0])
    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0: lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0: upper.pop()
        upper.append(p)
    hull = lower[:-1] + upper[:-1]
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon(hull, fill=255)
    mask = np.asarray(m) > 0
else:
    mask = np.asarray(fg_img) > 0
assert 0.1 < mask.mean() < 0.95, f"détourage suspect (produit = {mask.mean():.0%})"
alpha = Image.fromarray((mask * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.0))
out = src.copy(); out.putalpha(alpha); out.crop(alpha.point(lambda v: 255 if v > 20 else 0).getbbox()).save(sys.argv[2])
