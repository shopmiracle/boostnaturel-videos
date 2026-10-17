# Vidéo produit 3D (révélation « cinéma »)

Chaîne : packshot Shopify -> détourage -> scène three.js r170 (Chromium sans écran, rendu image par image) -> son de synthèse calé sur la physique -> cartons texte -> MP4 1080×1920.

1. Ajouter `nom.jpg URL_CDN_SHOPIFY` dans `assets/urls.txt` et pousser : l'Action `fetch-assets` télécharge l'image dans `assets/`.
2. `python3 -I cutout.py assets/nom.jpg www/pouch.png`
3. Copier `three.module.js` (r170, `build/`) et `RoomEnvironment.js` (`examples/jsm/environments/`) dans `www/` avec `scene.html`.
4. `node render.mjs out/scene.mp4` (environ 2 s par image, 480 images).
5. `python3 -I finish.py out/scene.mp4 out/scene.bounces.json out/final.mp4`

Les textes (dose, avertissements) viennent de l'étiquette du produit et se modifient dans `finish.py`. Aucune allégation de santé.

## Styles (`styles/`)
`scene.html?cfg=<nom>` charge `cfg/<nom>.json` : glacial, levitate, scan, podium, gold, drop, burst. Textes et son : `txt/<nom>.json` + `finish.py`. `cutout.py` complète les zones blanches du produit par l'enveloppe convexe.

## Canette 360° (`canette/`)
`unwrap.py` déroule l'étiquette d'une photo de face (±78°) et mesure le profil ; le dos est rempli avec la couleur de fond de chaque ligne, sans texte inventé. `scene.html` : 8 plans coupés (silhouette, rotation 360°, gros plan gouttes, dessous, chute, angles, alignement de 3 canettes).
