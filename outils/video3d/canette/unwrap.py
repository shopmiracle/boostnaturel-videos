"""Déroule l'étiquette d'une canette photographiée de face -> texture 360° + profil (rayon par ligne).
Face visible : ±FRONT degrés lus dans la photo. Dos : prolongation des couleurs des bords, sans texte inventé.
Usage : python3 -I unwrap.py <photo.png> <texture.png> <profil.json>"""
import sys, json, math
import numpy as np
from PIL import Image, ImageFilter

FRONT, UP = 78.0, 3
im = Image.open(sys.argv[1]).convert("RGB"); a = np.asarray(im).astype(float); H, W = a.shape[:2]
fg = a.min(axis=2) < 240
prof = []
for y in range(H):
    xs = np.nonzero(fg[y])[0]
    prof.append((xs[0], xs[-1]) if len(xs) > 2 else None)
ys = [y for y in range(H) if prof[y]]; y0, y1 = ys[0], ys[-1]
rmax = max((p[1] - p[0]) / 2 for p in prof if p)
# largeur de texture : circonférence au rayon max
Wt = int(round(2 * math.pi * rmax)) * UP; Ht = (y1 - y0 + 1) * UP
big = np.asarray(im.resize((W * UP, H * UP), Image.LANCZOS)).astype(float)
tex = np.zeros((Ht, Wt, 3)); front = np.zeros(Wt, bool)
for j in range(Wt):
    phi = (j / Wt) * 360 - 180  # 0° = face avant au centre de la texture
    if abs(phi) <= FRONT: front[j] = True
for yy in range(Ht):
    y = y0 + yy / UP; p = prof[min(y1, int(round(y)))] or prof[y0]
    c, r = (p[0] + p[1]) / 2 + 0.5, (p[1] - p[0]) / 2
    for j in np.nonzero(front)[0]:
        phi = math.radians((j / Wt) * 360 - 180)
        x = (c + r * math.sin(phi)) * UP
        x0 = int(min(W * UP - 2, max(0, x))); fx = x - x0
        tex[yy, j] = big[int(min(H * UP - 1, y * UP)), x0] * (1 - fx) + big[int(min(H * UP - 1, y * UP)), x0 + 1] * fx
# retire l'ombrage cylindrique cuit dans la photo (profil de luminance par colonne)
lum = tex[:, front].mean(axis=(0, 2)); k = 31
sm = np.convolve(np.pad(lum, k, mode="edge"), np.ones(2 * k + 1) / (2 * k + 1), mode="same")[k:-k]
gain = np.clip(np.median(sm) / np.maximum(sm, 1), 0.85, 1.6)
tex[:, front] *= gain[None, :, None]
# dos : couleur de fond de chaque ligne (médiane hors texte sombre), fondu court avec les bords
jl, jr = np.nonzero(front)[0][[0, -1]]
fr = tex[:, front]; L = fr.mean(axis=2)
rowcol = np.array([np.median(fr[y][L[y] > 70], axis=0) if (L[y] > 70).sum() > 10 else fr[y].mean(axis=0) for y in range(Ht)])
rowcol = np.asarray(Image.fromarray(rowcol[:, None].astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(float)[:, 0]
edgeL, edgeR = tex[:, jl].copy(), tex[:, jr].copy(); tot = (jl - jr) % Wt; z = 0.12
for j in range(Wt):
    if front[j]: continue
    s = ((j - jr) % Wt) / tot
    if s < z: w = (s / z); w = w * w * (3 - 2 * w); tex[:, j] = edgeR * (1 - w) + rowcol * w
    elif s > 1 - z: w = ((1 - s) / z); w = w * w * (3 - 2 * w); tex[:, j] = edgeL * (1 - w) + rowcol * w
    else: tex[:, j] = rowcol
out = Image.fromarray(np.clip(tex, 0, 255).astype(np.uint8)).filter(ImageFilter.UnsharpMask(2, 80, 2))
out.save(sys.argv[2])
json.dump({"rows": [[(p[1] - p[0]) / 2 / rmax if p else 0, y] for y, p in enumerate(prof) if y0 <= y <= y1],
           "y0": y0, "y1": y1, "aspect": (y1 - y0 + 1) / (2 * rmax)}, open(sys.argv[3], "w"))
print("texture", out.size, "front cols", int(front.sum()), "rows", y0, y1)
