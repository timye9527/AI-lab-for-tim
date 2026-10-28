#!/usr/bin/env python3
"""女声初筛 + 生成 ZipVoice 音色参考（不用任何真人录音）。

  python3 production/voices.py screen            → 用 Kokoro v1.1 的 55 个中文女声各读一句「刁钻文本」，听写打分、测音高 → out/voices/screen.json
  python3 production/voices.py ref 23 [27 ...]   → 用这些女声合成参考句，存到 out/voice-ref/f<sid>/（ref.wav + ref.txt）
Kokoro v1.1 中文女声是 sid 3～57（zf_*），男声 58～102。做法同存储视频的 make_ref.py。
"""
import json, os, sys
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
MODELS = os.environ.get('MODELS_DIR', os.path.join(ROOT, 'out', 'models'))
K = os.path.join(MODELS, 'kokoro-int8-multi-lang-v1_1') + '/'
# 刁钻文本：多音字、变调、数字（已转中文）
HARD = '假设每家公司每个月付给他一千元，他还要承担获客成本，整个行业重新洗牌。'
# 参考句：讲故事的语气，ZipVoice 照它的音色和语气读全片
REF = '故事发生在一个普通县城，你别看婚庆现场热热闹闹，背后其实有一大堆事情。'

def kokoro():
    import sherpa_onnx
    return sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
        model=K + 'model.int8.onnx', voices=K + 'voices.bin', tokens=K + 'tokens.txt', data_dir=K + 'espeak-ng-data', dict_dir=K + 'dict',
        lexicon=K + 'lexicon-us-en.txt,' + K + 'lexicon-zh.txt'), num_threads=4), rule_fsts=K + 'number-zh.fst', max_num_sentences=1))

def f0(x, sr):
    # 逐帧自相关取基频，返回有声帧的中位数（Hz）
    hop, win, out = int(sr * 0.01), int(sr * 0.04), []
    for i in range(0, len(x) - win, hop):
        fr = x[i:i + win] - x[i:i + win].mean()
        if np.sqrt((fr ** 2).mean()) < 0.02:
            continue
        ac = np.correlate(fr, fr, 'full')[win - 1:]
        lo, hi = int(sr / 400), int(sr / 120)
        k = lo + int(np.argmax(ac[lo:hi]))
        if ac[k] > 0.3 * ac[0]:
            out.append(sr / k)
    return float(np.median(out)) if out else 0.0

def main():
    tts = kokoro()
    if sys.argv[1] == 'screen':
        from asr_check import transcribe, check
        asr = os.path.join(MODELS, 'sherpa-onnx-paraformer-zh-small-2024-03-09')
        rows = []
        for sid in range(3, 58):
            r = tts.generate(HARD, sid=sid, speed=1.0)
            x = np.asarray(r.samples, dtype=np.float32)
            rate, issue = check(HARD, transcribe(asr, x.tolist(), r.sample_rate))
            rows.append({'sid': sid, 'err': round(rate, 3), 'f0': round(f0(x, r.sample_rate)), 'secs': round(len(x) / r.sample_rate, 2)})
            print(rows[-1], flush=True)
        os.makedirs(os.path.join(ROOT, 'out', 'voices'), exist_ok=True)
        json.dump(rows, open(os.path.join(ROOT, 'out', 'voices', 'screen.json'), 'w'), indent=1)
    else:
        for sid in map(int, sys.argv[2:]):
            r = tts.generate(REF, sid=sid, speed=1.0)
            d = os.path.join(ROOT, 'out', 'voice-ref', f'f{sid}'); os.makedirs(d, exist_ok=True)
            sf.write(os.path.join(d, 'ref.wav'), np.asarray(r.samples, dtype=np.float32), r.sample_rate)
            open(os.path.join(d, 'ref.txt'), 'w', encoding='utf8').write(REF)
            print('参考音色 →', d)

if __name__ == '__main__':
    main()
