#!/usr/bin/env python3
"""婚庆片配音：按分镜逐句合成，回听比对，输出整轨 + 时间轴 + 字幕。

  python3 production/tts.py --engine zipvoice --ref out/voice-ref/f23 --shots C49-C54 --out out/sample/f23
  python3 production/tts.py --engine matcha --shots C49-C54 --out out/sample/matcha
  （不带 --shots 就是全片）
沿用存储视频 video/memory-wallst/production/tts.py 的做法：
  数字一律转中文；AI 拆成「A I」；ZipVoice 按 0.95 倍生成再保持音调加速，防句尾被截断；句尾淡出。
  每句用 Paraformer 听写回来按拼音比对，不过就重读，最多 3 次，仍不过写进报告。
依赖：pip install sherpa-onnx soundfile numpy pypinyin；模型在 out/models/（下载脚本 out/models/dl.sh 的同款地址见 README）
"""
import argparse, hashlib, json, os, re, subprocess, sys, tempfile
import numpy as np, soundfile as sf
from pypinyin import lazy_pinyin, Style

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from numcn import to_chinese
from pronounce import load_curated, tokens

MODELS = os.environ.get('MODELS_DIR', os.path.join(ROOT, 'out', 'models'))

def shots():
    js = "import('./storyboard.mjs').then(m=>console.log(JSON.stringify(m.SHOTS.map(s=>({id:s.id,vo:s.vo})))))"
    return json.loads(subprocess.run(['node', '-e', js], cwd=ROOT, capture_output=True, text=True, check=True).stdout)

def say(text):
    t = re.sub(r'\bAI\b', 'A I', text)
    t = re.sub(r'[「」《》“”"]', '', t)
    t = to_chinese(t)
    if re.search(r'\d', t):
        raise SystemExit(f'配音文本里还有阿拉伯数字，拒绝合成：{t}')
    return t

# 「一」「不」变调：按后一个字的声调生成词条，写进合成词典（两种模型都不可靠，统一由程序定）
def sandhi_words(lines):
    out = {}
    for ln in lines:
        han = re.sub(r'[^一-鿿]', '', say(ln))
        py = lazy_pinyin(han, style=Style.TONE3, neutral_tone_with_five=True)
        for i, ch in enumerate(han[:-1]):
            if ch not in '一不' or (ch == '一' and i and han[i - 1] in '第统唯十'):
                continue
            nxt = py[i + 1]; tone = nxt[-1]
            if ch == '一':
                syl = 'yi2' if tone == '4' else 'yi4'
            else:
                syl = 'bu2' if tone == '4' else 'bu4'
            out[han[i:i + 2]] = f'{syl} {nxt}'
    return out

def build_lexicon(engine, lines, path):
    cur = {w: py for w, (py, _) in load_curated().items()}
    auto = sandhi_words(lines)
    for w, py in auto.items():
        cur.setdefault(w, py)
    if engine == 'zipvoice':
        base = os.path.join(MODELS, 'sherpa-onnx-zipvoice-distill-int8-zh-en-emilia', 'lexicon.txt')
        # ZipVoice 词典也没有英文字母，「A I」被当 OOV 整个丢掉（婚庆片实测，时长和不带 AI 的句子一样）
        rows = [f'{w} {tokens(py)}' for w, py in cur.items()] + [f'{c} {tokens(py)}' for c, py in [('A', 'ei1'), ('a', 'ei1'), ('I', 'ai4'), ('i', 'ai4')]]
    else:
        base = os.path.join(MODELS, 'matcha-icefall-zh-en', 'lexicon.txt')
        # Matcha 词典里没有单个字母，不加就整个跳过（婚庆片实测）；按中文音节读
        rows = [f'{w} {py}' for w, py in cur.items()] + ['A ei1', 'a ei1', 'I ai4', 'i ai4']
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf8') as f:
        f.write('\n'.join(rows) + '\n'); f.write(open(base, encoding='utf8').read())
    return cur

def zipvoice(a, lex):
    import sherpa_onnx
    M = os.path.join(MODELS, 'sherpa-onnx-zipvoice-zh-en-emilia') + '/'
    L = os.path.join(MODELS, 'sherpa-onnx-zipvoice-distill-int8-zh-en-emilia') + '/'
    tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
        zipvoice=sherpa_onnx.OfflineTtsZipvoiceModelConfig(
            tokens=L + 'tokens.txt', encoder=M + 'text_encoder.onnx', decoder=M + 'fm_decoder.onnx',
            vocoder=os.path.join(MODELS, 'vocos_24khz.onnx'), data_dir=L + 'espeak-ng-data', lexicon=lex),
        num_threads=os.cpu_count() or 4)))
    p, psr = sf.read(os.path.join(a.ref, 'ref.wav'), dtype='float32')
    ptxt = open(os.path.join(a.ref, 'ref.txt'), encoding='utf8').read().strip()

    def gen(text):
        base = 0.95
        for _ in range(3):
            r = tts.generate(text, ptxt, p.tolist(), psr, speed=base, num_steps=16)
            x = np.asarray(r.samples, dtype=np.float32)
            if float(np.abs(x[-int(0.06 * r.sample_rate):]).max()) < 0.15:
                break
            base -= 0.05  # 句尾还在高音量 = 被截断，放慢重来
        return x, r.sample_rate, a.speed / base
    return gen

def matcha(a, lex):
    import sherpa_onnx
    D = os.path.join(MODELS, 'matcha-icefall-zh-en') + '/'
    tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
        matcha=sherpa_onnx.OfflineTtsMatchaModelConfig(
            acoustic_model=D + 'model-steps-3.onnx', vocoder=os.path.join(MODELS, 'vocos-16khz-univ.onnx'),
            lexicon=lex, tokens=D + 'tokens.txt', data_dir=D + 'espeak-ng-data', noise_scale=0.667),
        num_threads=os.cpu_count() or 4), max_num_sentences=1))

    def gen(text):
        r = tts.generate(text, sid=0, speed=a.speed)
        return np.asarray(r.samples, dtype=np.float32), r.sample_rate, 1.0
    return gen

def finish(x, sr, tempo):
    idx = np.where(np.abs(x) > 0.012)[0]
    if len(idx):
        x = x[max(0, idx[0] - int(0.02 * sr)): idx[-1] + int(0.03 * sr)]
    f = int(0.04 * sr); x[-f:] *= np.linspace(1, 0, f)  # 句尾淡出
    if abs(tempo - 1) > 0.01:
        with tempfile.TemporaryDirectory() as td:
            sf.write(td + '/i.wav', x, sr)
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', td + '/i.wav', '-af', f'atempo={tempo:.4f}', td + '/o.wav'], check=True)
            x, _ = sf.read(td + '/o.wav', dtype='float32')
    return x

def srt_time(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02}:{m:02}:{s:02},{ms:03}'

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--engine', default='zipvoice', choices=['zipvoice', 'matcha'])
    ap.add_argument('--ref', default='', help='ZipVoice 音色参考目录：ref.wav + ref.txt（make_ref.py 生成）')
    ap.add_argument('--speed', type=float, default=1.0)
    ap.add_argument('--shots', default='', help='只合成这些镜头，如 C49-C54')
    ap.add_argument('--out', required=True)
    a = ap.parse_args()

    all_shots = shots()
    if a.shots:
        lo, _, hi = a.shots.partition('-'); hi = hi or lo
        all_shots = [s for s in all_shots if lo <= s['id'] <= hi]
    lines = [(s['id'], v) for s in all_shots for v in s['vo']]
    out = a.out; os.makedirs(out, exist_ok=True)
    lex = os.path.join(out, 'lexicon.txt')
    build_lexicon(a.engine, [v for _, v in lines], lex)
    # 英文词必须在词典里：两个模型遇到词典外的英文都直接丢掉，只在 stderr 打一行 OOV
    words = {ln.split(maxsplit=1)[0] for ln in open(lex, encoding='utf8') if ln.strip()}
    miss = sorted({w for _, v in lines for w in re.findall(r'[A-Za-z]+', say(v)) if w not in words})
    if miss:
        raise SystemExit(f'词典里没有这些英文，合成时会被丢掉：{miss}')
    gen = zipvoice(a, lex) if a.engine == 'zipvoice' else matcha(a, lex)
    from asr_check import transcribe, check
    asr = os.path.join(MODELS, 'sherpa-onnx-paraformer-zh-small-2024-03-09')

    SR = 48000
    chunks, t, prev, rows = [np.zeros(int(SR * 0.3), dtype=np.float32)], 0.3, None, []
    cache = os.path.join(out, 'lines'); os.makedirs(cache, exist_ok=True)
    for i, (sid, text) in enumerate(lines):
        tts_text = say(text)
        key = hashlib.md5(json.dumps([a.engine, a.ref, a.speed, tts_text]).encode()).hexdigest()[:10]
        wav = os.path.join(cache, f'{i:03d}-{key}.wav')
        tries, heard, rate, issue = 0, '', 0, ''
        if os.path.exists(wav):
            x, _ = sf.read(wav, dtype='float32')
        else:
            best = None
            for tries in range(1, 4):
                x, sr, tempo = gen(tts_text)
                x = finish(x, sr, tempo)
                heard = transcribe(asr, x.tolist(), sr)
                rate, issue = check(tts_text, heard)
                if best is None or rate < best[1]:
                    best = (x, rate, issue, heard, sr)
                if not issue:
                    break
            x, rate, issue, heard, sr = best
            x = np.interp(np.linspace(0, len(x) - 1, int(len(x) * SR / sr)), np.arange(len(x)), x).astype(np.float32)
            sf.write(wav, x, SR)
        gap = 0 if prev is None else (0.12 if sid == prev else 0.35)
        chunks.append(np.zeros(int(SR * gap), dtype=np.float32)); t += gap
        rows.append({'shot': sid, 'text': text, 'say': tts_text, 'start': round(t, 3), 'end': round(t + len(x) / SR, 3),
                     'heard': heard, 'err': round(rate, 3), 'issue': issue, 'tries': tries})
        chunks.append(x); t += len(x) / SR; prev = sid
        print(f'{i + 1}/{len(lines)} {t:.1f}s {"⚠ " + issue if issue else "✓"} {text[:18]}', flush=True)
    chunks.append(np.zeros(int(SR * 0.5), dtype=np.float32)); t += 0.5
    y = np.concatenate(chunks); y = y / (np.abs(y).max() + 1e-9) * 0.9
    sf.write(os.path.join(out, 'voice.wav'), y, SR)
    json.dump({'duration': round(t, 3), 'engine': a.engine, 'ref': a.ref, 'speed': a.speed, 'lines': rows},
              open(os.path.join(out, 'timeline.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    with open(os.path.join(out, 'subtitles.srt'), 'w', encoding='utf8') as f:
        for k, r in enumerate(rows, 1):
            f.write(f'{k}\n{srt_time(r["start"])} --> {srt_time(r["end"])}\n{r["text"]}\n\n')
    bad = [r for r in rows if r['issue']]
    syl = sum(len(re.sub(r'[^一-鿿]', '', r['say'])) + r['say'].count('A I') * 2 for r in rows)
    speech = sum(r['end'] - r['start'] for r in rows)
    print(f'done {t:.1f}s；语速 {syl / speech:.2f} 音节/秒（不含停顿）；回听有问题 {len(bad)} 句')

if __name__ == '__main__':
    main()
