"""Finition : son de synthèse (impacts calés sur la physique des cerises), cartons texte, assemblage MP4.
Usage : python3 -I finish.py <scene.mp4> <bounces.json> <sortie.mp4>"""
import json, subprocess, sys, wave, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

scene, bounces_p, out = sys.argv[1:4]
D = os.path.join(os.path.dirname(os.path.abspath(out)), "parts"); os.makedirs(D, exist_ok=True)
SR, DUR = 48000, 16.0
t = np.arange(int(SR * DUR)) / SR
rng = np.random.default_rng(7)

def env(a, d, start, length):
    e = np.zeros_like(t); m = (t >= start) & (t < start + length); tt = t[m] - start
    e[m] = np.minimum(1, tt / max(a, 1e-4)) * np.exp(-tt / d); return e

def lowpass(x, k):
    return np.convolve(x, np.ones(k) / k, mode="same")

L = np.zeros_like(t); R = np.zeros_like(t)
# nappe grave (contre-jour rouge)
swell = np.clip(t / 2.5, 0, 1) ** 2 * (1 - np.clip((t - 14.5) / 1.5, 0, 1))
drone = (np.sin(2 * np.pi * 41.2 * t) + 0.6 * np.sin(2 * np.pi * 55 * t) + 0.25 * np.sin(2 * np.pi * 82.4 * t)) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.25 * t))
L += 0.22 * drone * swell; R += 0.22 * drone * swell
# montée + impact à l'allumage (2,62 s)
rise = (t >= 1.2) & (t < 2.62)
noise = rng.standard_normal(t.size)
riser = np.zeros_like(t); riser[rise] = ((t[rise] - 1.2) / 1.42) ** 2.5
L += 0.10 * lowpass(noise, 6) * riser; R += 0.10 * lowpass(rng.standard_normal(t.size), 6) * riser
boom = np.sin(2 * np.pi * (48 + 30 * np.exp(-(t - 2.62).clip(0) * 12)) * (t - 2.62).clip(0)) * env(0.002, 0.45, 2.62, 2.5)
L += 0.55 * boom; R += 0.55 * boom
burst = lowpass(noise, 3) * env(0.001, 0.08, 2.62, 0.5); L += 0.25 * burst; R += 0.25 * burst
# impacts des cerises
for b in json.load(open(bounces_p)):
    st, v = b["t"], min(1.0, b["v"] / 2.5)
    f0 = 240 + 80 * rng.random()
    tt = (t - st).clip(0)
    tok = np.sin(2 * np.pi * (f0 * (1 + 0.6 * np.exp(-tt * 40))) * tt) * env(0.001, 0.045, st, 0.3)
    click = lowpass(rng.standard_normal(t.size), 2) * env(0.0005, 0.006, st, 0.05)
    pan = rng.uniform(0.3, 0.7)
    s = 0.35 * v * (tok + 0.4 * click); L += s * (1 - pan) * 2; R += s * pan * 2
# souffle de la poudre
air = np.zeros_like(t); m = (t >= 4.2) & (t < 11.5); x = (t[m] - 4.2) / 7.3
air[m] = np.sin(np.pi * x) ** 1.5
L += 0.07 * lowpass(rng.standard_normal(t.size), 14) * air; R += 0.07 * lowpass(rng.standard_normal(t.size), 14) * air
# nappe d'accords + pulsation douce
pad_env = np.clip((t - 2.62) / 2.0, 0, 1) * (1 - np.clip((t - 14.8) / 1.2, 0, 1))
for f, a in ((220, 1), (261.63, 0.8), (329.63, 0.7), (110, 0.6)):
    L += 0.035 * a * np.sin(2 * np.pi * f * t) * pad_env; R += 0.035 * a * np.sin(2 * np.pi * f * 1.003 * t) * pad_env
for k in np.arange(6.95, 15.0, 0.6667):
    tt = (t - k).clip(0); kick = np.sin(2 * np.pi * (50 + 60 * np.exp(-tt * 30)) * tt) * env(0.001, 0.12, k, 0.6)
    L += 0.28 * kick; R += 0.28 * kick
end_hit = np.sin(2 * np.pi * 45 * (t - 11.2).clip(0)) * env(0.002, 0.6, 11.2, 3)
L += 0.35 * end_hit; R += 0.35 * end_hit
# réverbération (réponse impulsionnelle synthétique)
ir = rng.standard_normal(int(SR * 1.6)) * np.exp(-np.arange(int(SR * 1.6)) / (SR * 0.35)); ir /= np.abs(ir).sum() / 6
n = 1 << int(np.ceil(np.log2(t.size + ir.size)))
rev = lambda x: np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: t.size]
L, R = L + 0.18 * rev(L), R + 0.18 * rev(R)
st = np.stack([L, R], 1); st /= np.abs(st).max() * 1.12
fade = np.clip((DUR - t) / 0.6, 0, 1)[:, None]; st *= fade
wav = os.path.join(D, "audio.wav")
with wave.open(wav, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype("<i2").tobytes())
assert os.path.getsize(wav) > SR * 4 * 15, "audio trop court"

# ---------- cartons texte (PNG transparents) ----------
FB = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
FM = "/usr/share/fonts/truetype/google-fonts/Poppins-Medium.ttf"
FR = "/usr/share/fonts/truetype/google-fonts/Poppins-Regular.ttf"
def card(name, lines, y0, box=True, pad=34):
    im = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0)); dr = ImageDraw.Draw(im)
    fonts = [(ImageFont.truetype(f, s), txt, col, gap) for txt, f, s, col, gap in lines]
    widths = [dr.textbbox((0, 0), txt, font=fo)[2] for fo, txt, _, _ in fonts]
    assert max(widths) <= 860, f"{name}: ligne trop large ({max(widths)} px)"  # zone sûre TikTok/Reels
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

W_, ROSE, RED = (255, 255, 255, 255), (255, 190, 190, 255), (255, 92, 98, 255)
hook = card("hook", [("CRÉATINE MONOHYDRATE", FB, 66, W_, 14), ("OstroVit · saveur cerise · 300 g", FM, 40, ROSE, 0)], 250, box=False)
dose = card("dose", [("Par dose de 3 g", FM, 42, W_, 10), ("2 288 mg de créatine", FB, 64, RED, 16),
                     ("1 portion par jour", FR, 36, W_, 6), ("dans 100 à 150 ml d'eau ou de jus", FR, 36, W_, 0)], 175)
warn = card("warn", [("Contient des édulcorants", FB, 38, W_, 14), ("Ne convient pas : insuffisance rénale,", FR, 32, W_, 6),
                     ("enfants, femmes enceintes ou allaitantes.", FR, 32, W_, 6), ("Ne pas dépasser la dose journalière.", FR, 32, W_, 6),
                     ("Ne remplace pas une alimentation variée.", FR, 32, W_, 0)], 1395)
brand = card("brand", [("boostnaturel.com", FB, 56, W_, 0)], 270, box=False)

fade = lambda i, a, b: f"[{i}:v]format=rgba,fade=t=in:st={a}:d=0.45:alpha=1,fade=t=out:st={b - 0.45}:d=0.45:alpha=1[o{i}]"
fc = ";".join([fade(1, 0.6, 3.4), fade(2, 7.0, 10.9), fade(3, 11.3, 16.6), fade(4, 11.8, 16.6),
               "[0:v][o1]overlay[v1];[v1][o2]overlay[v2];[v2][o3]overlay[v3];[v3][o4]overlay,format=yuv420p[v]",
               "[5:a]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]"])
cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", scene]
for p in (hook, dose, warn, brand): cmd += ["-loop", "1", "-t", str(DUR), "-i", p]
cmd += ["-i", wav, "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "18",
        "-profile:v", "high", "-r", "30", "-c:a", "aac", "-b:a", "160k", "-t", str(DUR), "-movflags", "+faststart", out]
subprocess.run(cmd, check=True)
print("ok", out)
