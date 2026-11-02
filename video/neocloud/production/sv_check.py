#!/usr/bin/env python3
"""成片 / 逐句复核：用 SenseVoice（能听英文）把每句配音听写回来，重点看英文专名和「新云」。
  python3 production/sv_check.py [--audio out/audio] [--only 英文]   → 打印每句听写
"""
import argparse, json, os, re
import numpy as np, soundfile as sf
ap = argparse.ArgumentParser(); ap.add_argument('--audio', default='out/audio'); ap.add_argument('--only', default='')
ap.add_argument('--model', default=os.environ.get('SV_DIR', os.path.join(os.path.dirname(__file__), '../../../.cache/models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2024-07-17')))
a = ap.parse_args()
import sherpa_onnx
d = a.model.rstrip('/') + '/'
rec = sherpa_onnx.OfflineRecognizer.from_sense_voice(model=d + 'model.int8.onnx', tokens=d + 'tokens.txt', language='zh', use_itn=False, num_threads=4)
tl = json.load(open(os.path.join(a.audio, 'timeline.json'), encoding='utf8'))
x, sr = sf.read(os.path.join(a.audio, 'voice.wav'), dtype='float32')
for l in tl['lines']:
    if not l.get('text') or (a.only == '英文' and not re.search(r'[A-Za-z]|新云', l['text'])):
        continue
    seg = x[int(max(0, l['start'] - 0.05) * sr): int((l['end'] + 0.05) * sr)]
    s = rec.create_stream(); s.accept_waveform(sr, seg.tolist()); rec.decode_stream(s)
    print(f"{l['text']}\n    → {s.result.text}")
