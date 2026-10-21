#!/usr/bin/env bash
# 分段并行渲染整片，拼接后混入配乐。用法：bash scripts/render_all.sh [段数]
set -euo pipefail
cd "$(dirname "$0")/.."
N=${1:-3}
DUR=$(node -e "import('./scene/story.js').then(m=>console.log(m.DURATION))")
mkdir -p out/parts
: > out/parts/list.txt
pids=()
for i in $(seq 0 $((N - 1))); do
  a=$(node -e "console.log(($DUR*$i/$N).toFixed(3))")
  b=$(node -e "console.log(($DUR*($i+1)/$N).toFixed(3))")
  node scripts/render.mjs --from "$a" --to "$b" --out "out/parts/p$i.mp4" > "out/parts/p$i.log" 2>&1 &
  pids+=($!)
  echo "file 'p$i.mp4'" >> out/parts/list.txt
done
for p in "${pids[@]}"; do wait "$p"; done
[ -f out/music.wav ] || python3 scripts/music.py "$DUR" out/music.wav
ffmpeg -y -loglevel error -f concat -safe 0 -i out/parts/list.txt -i out/music.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out/qichun.mp4
echo "done out/qichun.mp4"
