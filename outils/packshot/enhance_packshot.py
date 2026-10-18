#!/usr/bin/env python3
"""Améliore un packshot produit pour la vidéo (BoostNaturel).

Usage : python3 enhance_packshot.py photo.jpg [hauteur_cible=2400]
Sorties : <nom>_clean.png (fond transparent) et <nom>_avant_apres.jpg

Limite honnête : agrandir ne crée pas de détail réel. Aucun texte n'est
redessiné ; l'étiquette reste celle de la photo d'origine.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageOps

MIN_HEIGHT_OK = 1500  # en dessous, la photo source est trop petite pour les gros plans


def upscale(img, target_h):
    w, h = img.size
    scale = target_h / h
    # agrandissement par étapes de x2 max : moins de flou qu'un seul grand saut
    while scale > 2.0:
        img = img.resize((img.width * 2, img.height * 2), Image.LANCZOS)
        scale = target_h / img.height
    return img.resize((round(img.width * scale), target_h), Image.LANCZOS)


def row_span_alpha(src, size, T=20, inset=0.6):
    """Masque ligne par ligne : chaque ligne du produit = un seul segment.

    Le bord est pris sur les zones sombres (plastique, bouchon) puis lissé
    et rendu symétrique, ce qui corrige les étiquettes blanches sur fond blanc.
    shortcut: suppose un produit symétrique, d'un seul tenant par ligne
    (pot, flacon, canette, sachet) ; pour une forme découpée, passer à un
    détourage par IA.
    """
    a = np.asarray(src.convert("RGB")).astype(int)
    d = 255 - a.min(2)                       # distance au blanc
    H, W = d.shape
    L = np.full(H, np.nan); R = np.full(H, np.nan)
    for y in range(H):
        xs = np.where(d[y] > T)[0]
        if len(xs) >= 3:
            L[y], R[y] = xs.min(), xs.max() + 1
    ok = ~np.isnan(L)
    if not ok.any():
        raise SystemExit("produit introuvable : fond pas assez blanc")
    y0, y1 = np.where(ok)[0][[0, -1]]
    c = np.median(((L + R) / 2)[ok])
    hw = np.maximum(c - L, R - c)            # le côté le mieux détecté gagne
    rows = np.arange(H)
    hw = np.interp(rows, rows[ok], hw[ok])
    pad = np.pad(hw, 3, mode="edge")         # médiane glissante sur 7 lignes
    hw = np.median(np.lib.stride_tricks.sliding_window_view(pad, 7), axis=1)
    hw = np.where((rows >= y0) & (rows <= y1), hw - inset, 0)  # inset : mange le liseré JPG

    Wt, Ht = size
    s = Ht / H
    yy = (np.arange(Ht) + 0.5) / s
    hw_hr = np.interp(yy, rows + 0.5, hw) * s
    # haut et bas mesurés colonne par colonne : suit les bords courbes (bouchon, fond)
    Tc = np.full(W, np.nan); Bc = np.full(W, np.nan)
    for x in range(W):
        ys = np.where(d[:, x] > 2 * T)[0]      # seuil plus haut : ignore ombre et halo sous/sur le produit
        if len(ys) >= 3:
            Tc[x], Bc[x] = ys.min(), ys.max() + 1
    okc = ~np.isnan(Tc)
    cols = np.arange(W)
    med = lambda v: np.median(np.lib.stride_tricks.sliding_window_view(np.pad(v, 2, mode="edge"), 5), axis=1)
    Tc = med(np.interp(cols, cols[okc], Tc[okc])) + 2 * inset   # liseré JPG plus épais en haut et en bas
    Bc = med(np.interp(cols, cols[okc], Bc[okc])) - 2 * inset
    xx = np.arange(Wt) + 0.5
    xs = xx / s
    top = np.interp(xs, cols + 0.5, Tc); bot = np.interp(xs, cols + 0.5, Bc)
    v = np.clip((yy[:, None] - top[None, :]) * s + 0.5, 0, 1) * np.clip((bot[None, :] - yy[:, None]) * s + 0.5, 0, 1)
    h = np.clip(hw_hr[:, None] - np.abs(xx[None, :] - c * s) + 0.5, 0, 1)
    return Image.fromarray((h * v * 255).astype(np.uint8), "L")


def enhance(path, target_h=2400):
    src = Image.open(path)
    src = ImageOps.exif_transpose(src).convert("RGB")
    warn = src.height < MIN_HEIGHT_OK

    work = src.filter(ImageFilter.GaussianBlur(0.5))       # atténue les blocs JPG
    work = upscale(work, target_h)
    work = work.filter(ImageFilter.UnsharpMask(radius=2.0, percent=110, threshold=3))
    work = ImageEnhance.Contrast(work).enhance(1.05)  # pas d autocontrast : il teinte le gris en brun
    work = ImageEnhance.Color(work).enhance(1.06)

    # bord mesuré sur la photo d'origine, dessiné net à la taille finale
    alpha = row_span_alpha(src, work.size)
    out = work.convert("RGBA")
    out.putalpha(alpha)

    stem = Path(path).with_suffix("").name
    out_png = Path(path).with_name(f"{stem}_clean.png")
    out.save(out_png)

    # comparatif avant/après à la même hauteur
    h = 900
    before = src.resize((round(src.width * h / src.height), h), Image.LANCZOS)
    after = work.resize((round(work.width * h / work.height), h), Image.LANCZOS)
    sheet = Image.new("RGB", (before.width + after.width + 30, h + 20), (30, 30, 30))
    sheet.paste(before, (10, 10))
    sheet.paste(after, (before.width + 20, 10))
    out_cmp = Path(path).with_name(f"{stem}_avant_apres.jpg")
    sheet.save(out_cmp, quality=92)

    print(f"source : {src.width}x{src.height}px -> {out.width}x{out.height}px")
    if warn:
        print(f"ATTENTION : source < {MIN_HEIGHT_OK}px de haut. Plan large seulement, "
              "pas de gros plan sur l'étiquette. Demander une photo HD.")
    print(out_png, out_cmp)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    enhance(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 2400)
