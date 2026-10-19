"""逐句合成配音，拼成整条音轨，输出每句的起止时间和读音表。

用法：python3 tts.py <beats.json> <输出目录> [读音表.md] [--check]
beats.json：{"voice": {"speed"}, "beats": [{"text", "gap"}]}
读音由 pron.py 决定：每句生成附加词典条目，模型逐字照读，不靠它自己猜多音字。
--check：用语音识别把每句转写回来，列出字错率最高的几句，用来发现吞字、含糊。
"""
import hashlib, json, os, re, sys, difflib
import numpy as np
import soundfile as sf
import sherpa_onnx
import pron

ROOT = os.path.dirname(os.path.abspath(__file__))
M = os.path.join(ROOT, '..', '.cache', 'models') + '/'
D = M + 'matcha-icefall-zh-en/'


def load_tts(lexicon):
    cfg = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            matcha=sherpa_onnx.OfflineTtsMatchaModelConfig(
                acoustic_model=D + 'model-steps-3.onnx', vocoder=M + 'vocos-16khz-univ.onnx',
                lexicon=lexicon, tokens=D + 'tokens.txt', data_dir=D + 'espeak-ng-data'),
            num_threads=4))
    return sherpa_onnx.OfflineTts(cfg)


def trim(x, sr, thr=0.01):
    # 去掉首尾静音，停顿统一由 gap 控制
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    return x[max(idx[0] - int(0.03 * sr), 0):min(idx[-1] + int(0.08 * sr), len(x))]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    src, out = args[0], args[1]
    sheet = args[2] if len(args) > 2 else None
    spec = json.load(open(src, encoding='utf-8'))
    voice = spec['voice']
    cache = os.path.join(out, 'cache')
    os.makedirs(cache, exist_ok=True)

    # 1. 读音分析，汇总附加词典
    tokens = {l.split()[0] for l in open(D + 'tokens.txt', encoding='utf-8') if l.strip()}
    entries, plans = {}, []
    for b in spec['beats']:
        norm, ent, chars = pron.analyze(b['text'])
        for w, py in ent.items():
            bad = [p for p in py if p not in tokens]
            if bad:
                raise SystemExit(f'模型没有这些音节：{bad}（{w}），检查 pron.txt')
            if w in entries and entries[w] != py:
                raise SystemExit(f'同一串字在不同句子里读音不同：{w}，请在 pron.txt 里加词')
            entries[w] = py
        key = hashlib.md5(json.dumps([norm, ent, voice, 'matcha-zh-en'], ensure_ascii=False).encode()).hexdigest()[:12]
        plans.append({'norm': norm, 'chars': chars, 'path': os.path.join(cache, key + '.wav')})
    lex = os.path.join(cache, 'lexicon.txt')
    with open(lex, 'w', encoding='utf-8') as f:
        for w, py in entries.items():
            f.write(f'{w} {" ".join(py)}\n')
        # 原词典里和附加条目重复的词跳过，附加条目优先
        for line in open(D + 'lexicon.txt', encoding='utf-8'):
            if line.split(' ', 1)[0] not in entries:
                f.write(line)

    # 2. 合成（已有的句子直接复用）
    tts = None
    for p in plans:
        if not os.path.exists(p['path']):
            tts = tts or load_tts(lex)
            a = tts.generate(p['norm'], sid=0, speed=voice.get('speed', 1.0))
            x = np.array(a.samples, dtype=np.float32)
            sf.write(p['path'], trim(x, a.sample_rate), a.sample_rate)

    # 3. 拼接
    pieces, timeline, t, sr0 = [], [], 0.0, None
    for i, (b, p) in enumerate(zip(spec['beats'], plans)):
        x, sr = sf.read(p['path'], dtype='float32')
        if sr0 is None:
            sr0 = sr
            pieces.append(np.zeros(int(0.35 * sr), dtype=np.float32))
            t = 0.35
        timeline.append({'start': round(t, 3), 'end': round(t + len(x) / sr, 3), 'wav': p['path']})
        pieces += [x, np.zeros(int(b['gap'] * sr), dtype=np.float32)]
        t += len(x) / sr + b['gap']
    audio = np.concatenate(pieces)
    audio *= 0.89 / max(np.abs(audio).max(), 1e-6)
    sf.write(os.path.join(out, 'voice.wav'), audio, sr0)
    json.dump({'duration': round(t, 3), 'beats': timeline}, open(os.path.join(out, 'timeline.json'), 'w'), indent=1)
    print(f'配音 {len(timeline)} 句，总长 {t:.1f} 秒')

    if sheet:
        write_sheet(sheet, spec['beats'], plans)
    if '--check' in sys.argv:
        asr_check(spec['beats'], plans)


def write_sheet(path, beats, plans):
    """读音表：多音字、覆盖词、变调都标出拼音，数字和英文写出实际读法，给人逐句审。"""
    lines = ['# 读音表', '',
             '> 自动生成。括号里是配音实际读的拼音：只标多音字、覆盖表里的词和「一」「不」变调。',
             '> 读错了就在 `factory/video/pron.txt` 加词，英文和符号的读法改 `read.txt`。', '']
    risky = []
    for i, p in enumerate(plans):
        hits = [f'{c}({pron.mark(py)})' for c, py, src in p['chars'] if c in pron.RISKY and src == '词典']
        if hits:
            risky.append(f'- 第 {i + 1} 句：' + '、'.join(hits))
    if risky:
        lines += ['## 重点审：高风险字（由词典自动取音，没经过覆盖表）', ''] + risky + ['', '## 逐句', '']
    for i, (b, p) in enumerate(zip(beats, plans)):
        marked, k = '', 0
        for c in re.sub(r'[^一-鿿]', '', p['norm']):
            ch, py, srcf = p['chars'][k]
            k += 1
            if srcf != '词典' or pron.is_poly(ch):
                marked += f'{ch}({pron.mark(py)})'
            else:
                marked += ch
        lines.append(f'{i + 1}. {marked}')
        plain = re.sub(r'[，。！？；：、,.!?;:\s]', '', b['text'])
        normp = re.sub(r'[，。！？；：、,.!?;:\s]', '', p['norm'])
        if plain != normp:
            lines.append(f'   - 实际读作：{p["norm"]}')
    open(path, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')


def asr_check(beats, plans):
    import librosa
    P = M + 'sherpa-onnx-paraformer-zh-2024-03-09/'
    asr = sherpa_onnx.OfflineRecognizer.from_paraformer(paraformer=P + 'model.int8.onnx', tokens=P + 'tokens.txt', num_threads=4)
    norm = lambda s: re.sub(r'[^一-鿿]', '', s)
    rows = []
    for b, p in zip(beats, plans):
        x, sr = sf.read(p['path'], dtype='float32')
        s = asr.create_stream()
        s.accept_waveform(16000, librosa.resample(x, orig_sr=sr, target_sr=16000) if sr != 16000 else x)
        asr.decode_stream(s)
        ref, hyp = norm(p['norm']), norm(s.result.text)
        rows.append((1 - difflib.SequenceMatcher(None, ref, hyp).ratio(), p['norm'], s.result.text))
    rows.sort(reverse=True)
    print(f'平均字错率 {sum(r[0] for r in rows) / len(rows):.3f}。最高的 10 句（同音字也算错，人工看一眼）：')
    for r in rows[:10]:
        print(f'{r[0]:.2f}\n  稿：{r[1]}\n  听：{r[2]}')


if __name__ == '__main__':
    main()
