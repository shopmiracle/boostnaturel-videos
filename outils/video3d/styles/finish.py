"""Finition d'une vidéo produit : son de synthèse (selon le style), cartons texte, assemblage MP4.
Usage : python3 -I finish.py <scene.mp4> <bounces.json> <textes.json> <sortie.mp4>
textes.json : {style, accent, root, hook:[...], mid:[...], end:[...]} ; ligne = [texte, B|M|R, taille, W|ROSE|ACC, écart]"""
import json, subprocess, sys, wave, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

scene, bounces_p, cfg_p, out = sys.argv[1:5]
cfg = json.load(open(cfg_p)); style = cfg["style"]
D = os.path.join(os.path.dirname(os.path.abspath(out)), "parts_" + os.path.basename(out).split(".")[0]); os.makedirs(D, exist_ok=True)
SR, DUR = 48000, 16.0
t = np.arange(int(SR * DUR)) / SR
rng = np.random.default_rng(cfg.get("seed", 7))
noise = lambda: rng.standard_normal(t.size)

def env(a, d, start, length):
    e = np.zeros_like(t); m = (t >= start) & (t < start + length); tt = t[m] - start
    e[m] = np.minimum(1, tt / max(a, 1e-4)) * np.exp(-tt / d); return e
def lowpass(x, k): return np.convolve(x, np.ones(k) / k, mode="same")
def window(a, b, fade=0.3): return np.clip((t - a) / fade, 0, 1) * np.clip((b - t) / fade, 0, 1)

L = np.zeros_like(t); R = np.zeros_like(t)
def add(sig, pan=0.5, g=1.0):
    global L, R
    L = L + g * sig * (1 - pan) * 2; R = R + g * sig * pan * 2
# base commune : nappe grave, montée, impact à 2,62 s, nappe d'accords, pulsation, impact de fin
swell = np.clip(t / 2.5, 0, 1) ** 2 * (1 - np.clip((t - 14.5) / 1.5, 0, 1))
add(0.11 * (np.sin(2 * np.pi * 41.2 * t) + 0.6 * np.sin(2 * np.pi * 55 * t)) * swell)
rise = np.zeros_like(t); m = (t >= 1.2) & (t < 2.62); rise[m] = ((t[m] - 1.2) / 1.42) ** 2.5
add(0.05 * lowpass(noise(), 6) * rise, 0.4); add(0.05 * lowpass(noise(), 6) * rise, 0.6)
add(0.28 * np.sin(2 * np.pi * (48 + 30 * np.exp(-(t - 2.62).clip(0) * 12)) * (t - 2.62).clip(0)) * env(0.002, 0.45, 2.62, 2.5))
add(0.12 * lowpass(noise(), 3) * env(0.001, 0.08, 2.62, 0.5))
root = cfg.get("root", 220.0); pad = np.clip((t - 2.62) / 2, 0, 1) * (1 - np.clip((t - 14.8) / 1.2, 0, 1))
for f, a in ((root, 1), (root * 1.1892, 0.8), (root * 1.4983, 0.7), (root / 2, 0.6)):
    L += 0.035 * a * np.sin(2 * np.pi * f * t) * pad; R += 0.035 * a * np.sin(2 * np.pi * f * 1.003 * t) * pad
for k in np.arange(6.95, 15.0, 0.6667):
    tt = (t - k).clip(0); add(0.14 * np.sin(2 * np.pi * (50 + 60 * np.exp(-tt * 30)) * tt) * env(0.001, 0.12, k, 0.6))
add(0.17 * np.sin(2 * np.pi * 45 * (t - 11.2).clip(0)) * env(0.002, 0.6, 11.2, 3))
# impacts des objets qui tombent
for b in json.load(open(bounces_p)):
    st, v = b["t"], min(1.0, b["v"] / 2.5); tt = (t - st).clip(0); pan = rng.uniform(0.25, 0.75)
    if b.get("type") == "ice":
        f0 = 1900 + 900 * rng.random()
        s = np.sin(2 * np.pi * f0 * tt) * env(0.0005, 0.05, st, 0.3) + 0.6 * np.sin(2 * np.pi * f0 * 1.51 * tt) * env(0.0005, 0.03, st, 0.2)
        add(0.10 * v * s, pan)
    else:
        f0 = 220 + 90 * rng.random()
        s = np.sin(2 * np.pi * (f0 * (1 + 0.6 * np.exp(-tt * 40))) * tt) * env(0.001, 0.045, st, 0.3)
        add(0.18 * v * (s + 0.4 * lowpass(noise(), 2) * env(0.0005, 0.006, st, 0.05)), pan)
# signatures sonores des styles
if style in ("glacial", "gold"):
    for _ in range(26):
        st = rng.uniform(3, 12.5); f0 = rng.uniform(2200, 4200); tt = (t - st).clip(0)
        add(0.025 * np.sin(2 * np.pi * f0 * tt) * env(0.002, 0.25, st, 1.2), rng.uniform(0.2, 0.8))
if style == "levitate":
    for i, f0 in enumerate((1318.5, 1568, 1975.5)):
        st = 3.0 + i * 0.35; tt = (t - st).clip(0); add(0.06 * np.sin(2 * np.pi * f0 * tt) * env(0.002, 0.7, st, 3), 0.3 + 0.2 * i)
    add(0.05 * lowpass(noise(), 10) * env(0.6, 0.8, 2.6, 2.5))
if style == "scan":
    hum = (np.sin(2 * np.pi * 220 * t) + 0.4 * np.sin(2 * np.pi * 880 * t) + 0.2 * np.sin(2 * np.pi * 1760 * t)) * (0.7 + 0.3 * np.sin(2 * np.pi * 14 * t))
    add(0.03 * hum * (window(2.6, 5.6) + window(8.0, 10.0)))
if style == "podium":
    for i in range(4):
        st = 0.4 + i * 0.45; add(0.06 * lowpass(noise(), 2) * env(0.001, 0.05, st, 0.2), 0.2 + 0.2 * i)
    add(0.012 * np.sin(2 * np.pi * 100 * t) * window(0.5, 15.5, 0.5))
if style == "gold":
    sw = np.zeros_like(t); m = (t >= 3) & (t < 6.5); sw[m] = np.sin(np.pi * (t[m] - 3) / 3.5) ** 2
    add(0.06 * lowpass(noise(), 12) * sw, 0.35); add(0.06 * lowpass(noise(), 12) * sw, 0.65)
if style == "burst":
    add(0.22 * lowpass(noise(), 8) * env(0.002, 0.6, 2.62, 3), 0.4); add(0.22 * lowpass(noise(), 8) * env(0.002, 0.6, 2.62, 3), 0.6)
# réverbération
ir = rng.standard_normal(int(SR * 1.6)) * np.exp(-np.arange(int(SR * 1.6)) / (SR * 0.35)); ir /= np.abs(ir).sum() / 6
n = 1 << int(np.ceil(np.log2(t.size + ir.size)))
rev = lambda x: np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: t.size]
L, R = L + 0.18 * rev(L), R + 0.18 * rev(R)
st = np.stack([L, R], 1); st /= np.abs(st).max() * 1.12; st *= np.clip((DUR - t) / 0.6, 0, 1)[:, None]
wav = os.path.join(D, "audio.wav")
with wave.open(wav, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype("<i2").tobytes())

# ---------- cartons texte ----------
F = {"B": "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf", "M": "/usr/share/fonts/truetype/google-fonts/Poppins-Medium.ttf",
     "R": "/usr/share/fonts/truetype/google-fonts/Poppins-Regular.ttf"}
acc = tuple(int(cfg["accent"][i:i + 2], 16) for i in (1, 3, 5)) + (255,)
COL = {"W": (255, 255, 255, 255), "ACC": acc, "ROSE": tuple(int(c + (255 - c) * 0.55) for c in acc[:3]) + (255,)}
def card(name, lines, y0, box=True, pad=34):
    im = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0)); dr = ImageDraw.Draw(im)
    fonts = [(ImageFont.truetype(F[f], s), txt, COL[c], gap) for txt, f, s, c, gap in lines]
    widths = [dr.textbbox((0, 0), txt, font=fo)[2] for fo, txt, _, _ in fonts]
    assert max(widths) <= 860, f"{name}: ligne trop large ({max(widths)} px) : {lines[widths.index(max(widths))][0]}"
    h = sum(fo.size + gap for fo, _, _, gap in fonts)
    if box:
        sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle((110, y0 - pad, 970, y0 + h + pad - 10), 28, fill=(0, 0, 0, 150))
        im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(1))); dr = ImageDraw.Draw(im)
    y = y0
    for (fo, txt, col, gap), wd in zip(fonts, widths):
        x = (1080 - wd) // 2
        if not box:
            shadow = Image.new("RGBA", im.size, (0, 0, 0, 0)); ImageDraw.Draw(shadow).text((x + 3, y + 4), txt, font=fo, fill=(0, 0, 0, 200))
            im = Image.alpha_composite(im, shadow.filter(ImageFilter.GaussianBlur(4))); dr = ImageDraw.Draw(im)
        dr.text((x, y), txt, font=fo, fill=col); y += fo.size + gap
    p = os.path.join(D, name + ".png"); im.save(p); return p

hook = card("hook", cfg["hook"], 250, box=False)
mid = card("mid", cfg["mid"], 175)
end = card("end", cfg["end"], cfg.get("end_y", 1395))
brand = card("brand", [["boostnaturel.com", "B", 56, "W", 0]], 270, box=False)
fade = lambda i, a, b: f"[{i}:v]format=rgba,fade=t=in:st={a}:d=0.45:alpha=1,fade=t=out:st={b - 0.45}:d=0.45:alpha=1[o{i}]"
fc = ";".join([fade(1, 0.6, 3.4), fade(2, 7.0, 10.9), fade(3, 11.3, 16.6), fade(4, 11.8, 16.6),
               "[0:v][o1]overlay[v1];[v1][o2]overlay[v2];[v2][o3]overlay[v3];[v3][o4]overlay,format=yuv420p[v]",
               "[5:a]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]"])
cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", scene]
for p in (hook, mid, end, brand): cmd += ["-loop", "1", "-t", str(DUR), "-i", p]
cmd += ["-i", wav, "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "18",
        "-profile:v", "high", "-r", "30", "-c:a", "aac", "-b:a", "160k", "-t", str(DUR), "-movflags", "+faststart", out]
subprocess.run(cmd, check=True)
print("ok", out)
