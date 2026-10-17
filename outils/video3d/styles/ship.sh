#!/bin/bash
# Finition + planche de contrôle + copie dans le dépôt pour une vidéo (d1..d7)
set -e
S=/tmp/claude-0/-home-claude/aaf9d63d-a1e1-5d50-8937-ddd9d3914284/scratchpad/series; d=$1; cd $S
name=$(python3 -c "import json;print(json.load(open('posts.json'))['$d']['file'])")
python3 -I finish.py out/$d.scene.mp4 out/$d.scene.bounces.json txt/$d.json out/$name
ffmpeg -hide_banner -loglevel error -y -i out/$name -vf "select='eq(n\,20)+eq(n\,60)+eq(n\,95)+eq(n\,130)+eq(n\,170)+eq(n\,240)+eq(n\,300)+eq(n\,360)+eq(n\,420)+eq(n\,470)',scale=216:-1,tile=10x1" -frames:v 1 out/$d.sheet.jpg
cp out/$name /home/claude/boostnaturel-videos/produits/
echo "$name"
