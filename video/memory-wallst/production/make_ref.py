#!/usr/bin/env python3
"""生成频道默认音色的参考句（不用任何真人录音）。

用 Kokoro v1.1（Apache-2.0）的男声合成一句解说腔参考，交给 ZipVoice 做音色参考、重新生成语调。
  python3 production/make_ref.py [--sid 100] [--out out/voice-ref/default]
备选：--sid 60（沉稳）；AISHELL-3 男声见 09-栏目包装.md。
"""
import argparse, os
import numpy as np, soundfile as sf

REF = '今天我们来聊一个所有人都在关心的问题：存储这一周，到底发生了什么？'
ap = argparse.ArgumentParser()
ap.add_argument('--sid', type=int, default=100)
ap.add_argument('--out', default=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'out', 'voice-ref', 'default'))
ap.add_argument('--model-dir', default=os.environ.get('KOKORO_DIR', '/tmp/claude-0/tts/kokoro-int8-multi-lang-v1_1'))
a = ap.parse_args()
import sherpa_onnx
k = a.model_dir.rstrip('/') + '/'
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
    model=k + 'model.int8.onnx', voices=k + 'voices.bin', tokens=k + 'tokens.txt', data_dir=k + 'espeak-ng-data', dict_dir=k + 'dict',
    lexicon=k + 'lexicon-us-en.txt,' + k + 'lexicon-zh.txt'), num_threads=4), rule_fsts=k + 'number-zh.fst', max_num_sentences=1))
r = tts.generate(REF, sid=a.sid, speed=1.0)
os.makedirs(a.out, exist_ok=True)
sf.write(os.path.join(a.out, 'ref.wav'), np.asarray(r.samples, dtype=np.float32), r.sample_rate)
open(os.path.join(a.out, 'ref.txt'), 'w', encoding='utf8').write(REF)
print('参考音色 →', a.out)
