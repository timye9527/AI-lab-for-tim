#!/usr/bin/env bash
# 分段渲染整片，拼接后混入配乐。用法：[FMT=v] bash scripts/render_all.sh [段数]（FMT=v 出竖版）
set -euo pipefail
cd "$(dirname "$0")/.."
N=${1:-1}
FMT=${FMT:-h}
OUTF=out/qichun${FMT/h/}.mp4; [ "$FMT" = v ] && OUTF=out/qichun_v.mp4
PARTS=out/parts_$FMT
DUR=$(node -e "console.log(require('./data/audio/timeline.json').duration)")
mkdir -p $PARTS
: > $PARTS/list.txt
pids=()
for i in $(seq 0 $((N - 1))); do
  a=$(node -e "console.log(($DUR*$i/$N).toFixed(3))")
  b=$(node -e "console.log(($DUR*($i+1)/$N).toFixed(3))")
  node scripts/render.mjs --from "$a" --to "$b" --fmt "$FMT" --out "$PARTS/p$i.mp4" > "$PARTS/p$i.log" 2>&1 &
  pids+=($!)
  echo "file 'p$i.mp4'" >> $PARTS/list.txt
done
for p in "${pids[@]}"; do wait "$p"; done
AUDIO=data/audio/mix.wav
[ -f "$AUDIO" ] || { echo "缺少 $AUDIO，先跑 npm run audio"; exit 1; }
ffmpeg -y -loglevel error -f concat -safe 0 -i $PARTS/list.txt -i "$AUDIO" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$OUTF"
echo "done $OUTF"
