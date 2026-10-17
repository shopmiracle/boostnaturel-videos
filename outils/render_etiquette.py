"""Rendu vidéo produit 1080x1920 (ffmpeg drawtext) : étiquette créatine OstroVit cerise."""
import os, subprocess, sys

OUT = sys.argv[1]
LABEL = sys.argv[2]
D = os.path.dirname(os.path.abspath(__file__)) + "/txt"
os.makedirs(D, exist_ok=True)
B = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
M = "/usr/share/fonts/truetype/google-fonts/Poppins-Medium.ttf"
R = "/usr/share/fonts/truetype/google-fonts/Poppins-Regular.ttf"
DUR = 18.0
ORANGE, DARK = "0xC2410C", "0x1F1A17"

# (debut, fin, [(texte, police, taille, couleur, y)])
scenes = [
    (0.3, 3.8, [("Ce que dit l'étiquette", B, 62, DARK, 430), ("en 15 secondes", R, 46, DARK, 520)]),
    (3.8, 7.6, [("Par dose de 3 g", B, 62, DARK, 400), ("(3/4 de cuillère-mesure)", R, 40, DARK, 485),
                ("2 600 mg de créatine monohydrate", M, 46, ORANGE, 580), ("dont 2 288 mg de créatine", M, 46, ORANGE, 650)]),
    (7.6, 11.2, [("Mode d'emploi indiqué", B, 62, DARK, 400), ("3 g dans 100 à 150 ml", M, 48, DARK, 500),
                 ("d'eau ou de jus", M, 48, DARK, 570), ("1 portion par jour", M, 48, ORANGE, 660)]),
    (11.2, 15.2, [("Avertissements", B, 62, DARK, 390), ("Contient des édulcorants", M, 44, ORANGE, 480),
                  ("Ne convient pas : insuffisance rénale,", R, 38, DARK, 560),
                  ("enfants, femmes enceintes ou allaitantes", R, 38, DARK, 615),
                  ("Ne pas dépasser la dose journalière", M, 40, DARK, 690)]),
    (15.2, DUR, [("Un complément alimentaire", M, 46, DARK, 420), ("ne remplace pas une alimentation", M, 46, DARK, 490),
                 ("variée et équilibrée.", M, 46, DARK, 560), ("boostnaturel.com", B, 56, ORANGE, 680)]),
]
fixed = [("CRÉATINE MONOHYDRATE", B, 66, ORANGE, 150), ("OstroVit · saveur cerise · 300 g", M, 44, DARK, 245),
         ("Extrait de l'étiquette du fabricant", R, 30, DARK, 1640)]

n = 0
def dt(text, font, size, color, y, a=None, b=None):
    global n
    n += 1
    p = f"{D}/t{n}.txt"
    open(p, "w", encoding="utf-8").write(text)
    s = f"drawtext=fontfile={font}:textfile={p}:fontsize={size}:fontcolor={color}:x=(w-text_w)/2:y={y}"
    if a is not None:
        s += (f":alpha='if(lt(t,{a}),0,if(lt(t,{a}+0.3),(t-{a})/0.3,if(lt(t,{b}-0.3),1,"
              f"if(lt(t,{b}),({b}-t)/0.3,0))))'") if b < DUR else f":alpha='if(lt(t,{a}),0,min(1,(t-{a})/0.3))'"
    return s

boxes = ("drawbox=x=0:y=0:w=1080:h=330:color=0xFFE3C7:t=fill,"
         "drawbox=x=345:y=900:w=390:h=716:color=0xC2410C:t=fill,"
         "drawbox=x=355:y=910:w=370:h=696:color=white:t=fill")
chain = [dt(*f) for f in fixed]
for a, b, lines in scenes:
    chain += [dt(*l, a=a, b=b) for l in lines]

fc = (f"[1:v]scale=-1:660[lab];[0:v]{boxes}[bg];[bg][lab]overlay=x=(W-w)/2:y=928,{','.join(chain)},format=yuv420p[v];"
      # musique générée (accord La mineur doux + pulsation), aucun extrait sous droits
      "[2:a]volume=0.9,afade=t=in:d=1,afade=t=out:st=16.5:d=1.5,loudnorm=I=-16:TP=-1.5:LRA=11[a]")
music = ("aevalsrc='0.12*(sin(2*PI*220*t)+0.8*sin(2*PI*261.63*t)+0.7*sin(2*PI*329.63*t))"
         "*(0.6+0.4*sin(2*PI*2*t))+0.05*sin(2*PI*110*t)':s=44100:d=18")
cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
       "-f", "lavfi", "-i", f"color=c=0xFFF4E6:s=1080x1920:r=30:d={DUR}",
       "-loop", "1", "-t", str(DUR), "-i", LABEL,
       "-f", "lavfi", "-i", music,
       "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
       "-c:v", "libx264", "-profile:v", "high", "-preset", "medium", "-crf", "19", "-r", "30",
       "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-t", str(DUR), "-movflags", "+faststart", OUT]
subprocess.run(cmd, check=True)
print("ok", OUT)
