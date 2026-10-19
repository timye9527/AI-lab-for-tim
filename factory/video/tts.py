"""逐句合成配音，拼成整条音轨，输出每句的起止时间。

用法：python3 tts.py <beats.json> <输出目录> [--check]
beats.json：{"voice": {"sid", "speed"}, "beats": [{"text", "gap"}]}
--check：用语音识别把每句转写回来，列出字错率最高的几句，用来查多音字和读错的词。
"""
import hashlib, json, os, re, sys, difflib
import numpy as np
import soundfile as sf
import sherpa_onnx

ROOT = os.path.dirname(os.path.abspath(__file__))
M = os.path.join(ROOT, '..', '.cache', 'models') + '/'
K = M + 'kokoro-multi-lang-v1_1/'
SR = 24000


def load_tts():
    cfg = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                model=K + 'model.onnx', voices=K + 'voices.bin', tokens=K + 'tokens.txt',
                data_dir=K + 'espeak-ng-data', dict_dir=K + 'dict',
                lexicon=K + 'lexicon-us-en.txt,' + K + 'lexicon-zh.txt'),
            num_threads=4),
        rule_fsts=K + 'date-zh.fst,' + K + 'phone-zh.fst,' + K + 'number-zh.fst')
    return sherpa_onnx.OfflineTts(cfg)


def trim(x, thr=0.01):
    # 去掉首尾静音，停顿统一由 gap 控制
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    a = max(idx[0] - int(0.03 * SR), 0)
    b = min(idx[-1] + int(0.08 * SR), len(x))
    return x[a:b]


def main():
    src, out = sys.argv[1], sys.argv[2]
    check = '--check' in sys.argv
    spec = json.load(open(src, encoding='utf-8'))
    voice = spec['voice']
    cache = os.path.join(out, 'cache')
    os.makedirs(cache, exist_ok=True)
    tts = None
    pieces, timeline, t = [], [], 0.0
    lead = np.zeros(int(0.35 * SR), dtype=np.float32)
    pieces.append(lead)
    t += len(lead) / SR
    for i, b in enumerate(spec['beats']):
        key = hashlib.md5(json.dumps([b['text'], voice], ensure_ascii=False).encode()).hexdigest()[:12]
        path = os.path.join(cache, key + '.wav')
        if not os.path.exists(path):
            tts = tts or load_tts()
            a = tts.generate(b['text'], sid=voice['sid'], speed=voice['speed'])
            sf.write(path, trim(np.array(a.samples, dtype=np.float32)), a.sample_rate)
        x, sr = sf.read(path, dtype='float32')
        assert sr == SR
        timeline.append({'start': round(t, 3), 'end': round(t + len(x) / SR, 3), 'wav': path})
        pieces.append(x)
        t += len(x) / SR
        g = np.zeros(int(b['gap'] * SR), dtype=np.float32)
        pieces.append(g)
        t += len(g) / SR
    audio = np.concatenate(pieces)
    sf.write(os.path.join(out, 'voice.wav'), audio, SR)
    json.dump({'duration': round(t, 3), 'beats': timeline}, open(os.path.join(out, 'timeline.json'), 'w'), indent=1)
    print(f'配音 {len(timeline)} 句，总长 {t:.1f} 秒')
    if check:
        asr_check(spec['beats'], timeline)


def asr_check(beats, timeline):
    import librosa
    P = M + 'sherpa-onnx-paraformer-zh-2024-03-09/'
    asr = sherpa_onnx.OfflineRecognizer.from_paraformer(paraformer=P + 'model.int8.onnx', tokens=P + 'tokens.txt', num_threads=4)
    norm = lambda s: re.sub(r'[^一-鿿A-Za-z]', '', s).upper()
    rows = []
    for b, tl in zip(beats, timeline):
        x, _ = sf.read(tl['wav'], dtype='float32')
        s = asr.create_stream()
        s.accept_waveform(16000, librosa.resample(x, orig_sr=SR, target_sr=16000))
        asr.decode_stream(s)
        ref, hyp = norm(b['text']), norm(s.result.text)
        rows.append((1 - difflib.SequenceMatcher(None, ref, hyp).ratio(), b['text'], s.result.text))
    rows.sort(reverse=True)
    print('字错率最高的 12 句（数字会被转写成汉字，同音字也算错，人工看一眼即可）：')
    for r in rows[:12]:
        print(f'{r[0]:.2f}\n  稿：{r[1]}\n  听：{r[2]}')


if __name__ == '__main__':
    main()
