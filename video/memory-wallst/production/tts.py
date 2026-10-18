#!/usr/bin/env python3
"""口播配音：读 02 脚本的口播行，逐句合成，输出整轨 + 时间轴 + 字幕。

默认用 Tim 本人声音（ZipVoice 声音克隆，参考录音在 out/voice-ref/，不进仓库）：
  python3 production/tts.py [--speed 1.08] [--secs 0,1,2] [--out out/audio]
备用：--engine kokoro --sid 65（开源男声，不推荐）
合成前会先跑多音字核对（production/pronounce.py），有「待确认」就停下，过稿确认后再合成。
依赖：pip install sherpa-onnx soundfile numpy pypinyin
模型（sherpa-onnx GitHub 发布页）：tts-models/sherpa-onnx-zipvoice-zh-en-emilia、
  tts-models/sherpa-onnx-zipvoice-distill-int8-zh-en-emilia（取词典和 espeak 数据）、vocoder-models/vocos_24khz.onnx
输出：voice.wav、timeline.json、subtitles.srt
"""
import argparse, json, re, os, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'out', 'audio')  # 可用 --out 改

# 读音修正：只影响配音，不影响字幕
SAY = [
    (r'4F²', '四F平方'), (r'6F²', '六F平方'),
    (r'−(\d+(?:\.\d+)?)%', r'跌百分之\1'), (r'(\d+(?:\.\d+)?)%', r'百分之\1'),
    (r'OpenAI', 'Open A I'), (r'\bAMD\b', 'A M D'), (r'\bCEO\b', 'C E O'),
    (r'\bHBM\b', 'H B M'), (r'DDR5', 'D D R 5'), (r'RDIMM', 'R dim'),
    (r'\bAI\b', 'A I'), (r'在 X 上', '在X平台上'), (r'KOSPI', '韩国综合指数'),
    (r'[「」《》]', ''),
]

def parse(path):
    sec, out = -1, []
    for raw in open(path, encoding='utf8'):
        if raw.startswith('## '):
            sec += 1
            title = raw[3:].strip()
            continue
        if sec >= 0 and raw.startswith('@pause'):
            out.append({'sec': sec, 'title': title, 'text': '', 'pause': float(raw.split()[1])})
            continue
        if sec >= 0 and raw.startswith('> '):
            show = re.sub(r'\s*\[F\d+\]\s*', '', raw[2:]).strip()
            out.append({'sec': sec, 'title': title, 'text': show})
    return out

def say(text):
    for a, b in SAY:
        text = re.sub(a, b, text)
    return text

def srt_time(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02}:{m:02}:{s:02},{ms:03}'

def kokoro(a):
    import sherpa_onnx
    d = a.model_dir.rstrip('/') + '/'
    tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                model=d + 'model.int8.onnx', voices=d + 'voices.bin', tokens=d + 'tokens.txt',
                data_dir=d + 'espeak-ng-data', dict_dir=d + 'dict',
                lexicon=d + 'lexicon-us-en.txt,' + d + 'lexicon-zh.txt'),
            num_threads=os.cpu_count() or 4),
        rule_fsts=d + 'date-zh.fst,' + d + 'phone-zh.fst,' + d + 'number-zh.fst', max_num_sentences=1))
    return lambda text: tts.generate(say(text), sid=a.sid, speed=a.speed)

def zipvoice(a):
    import sherpa_onnx
    z = a.zipvoice.rstrip('/') + '/'
    M, L = z + 'sherpa-onnx-zipvoice-zh-en-emilia/', z + 'sherpa-onnx-zipvoice-distill-int8-zh-en-emilia/'
    lex = os.path.join(ROOT, 'out', 'tts', 'lexicon.txt')  # pronounce.py 生成：行业读音表优先
    tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
        zipvoice=sherpa_onnx.OfflineTtsZipvoiceModelConfig(
            tokens=L + 'tokens.txt', encoder=M + 'text_encoder.onnx', decoder=M + 'fm_decoder.onnx',
            vocoder=z + 'vocos_24khz.onnx', data_dir=L + 'espeak-ng-data', lexicon=lex),
        num_threads=os.cpu_count() or 4)))
    ref = a.ref_dir
    p, psr = sf.read(os.path.join(ref, 'ref.wav'), dtype='float32')
    ptxt = open(os.path.join(ref, 'ref.txt'), encoding='utf8').read().strip()

    def gen(text):
        r = tts.generate(say_clone(text), ptxt, p.tolist(), psr, speed=a.speed, num_steps=16)
        x = np.asarray(r.samples, dtype=np.float32)
        idx = np.where(np.abs(x) > 0.012)[0]  # 去掉首尾空白
        if len(idx):
            x = x[max(0, idx[0] - 480): idx[-1] + 720]
        class R: pass
        o = R(); o.samples, o.sample_rate = x, r.sample_rate
        return o
    return gen

# 克隆模型的读音修正：英文缩写拆开读，符号转中文；多音字交给 pronounce.tsv
SAY_CLONE = [
    (r'4F²', '4 F 平方'), (r'−(\d+(?:\.\d+)?)%', r'跌百分之\1'), (r'(\d+(?:\.\d+)?)%', r'百分之\1'),
    (r'\bCEO\b', 'C E O'), (r'\bHBM\b', 'H B M'), (r'\bFT\b', '英国金融时报'), (r'\bAI\b', 'A I'), (r'OpenAI', 'Open A I'),
    (r'DDR5', 'D D R 5'), (r'KOSPI', '韩国综合指数'), (r'[「」《》]', ''),
]

def say_clone(text):
    from numcn import to_chinese
    for a_, b_ in SAY_CLONE:
        text = re.sub(a_, b_, text)
    text = to_chinese(text)  # 阿拉伯数字一律转中文读法，否则会被读成英文
    if re.search(r'\d', text):
        raise SystemExit(f'配音文本里还有阿拉伯数字，拒绝合成：{text}')
    return text

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--engine', default='zipvoice', choices=['zipvoice', 'kokoro'])
    ap.add_argument('--sid', type=int, default=65)
    ap.add_argument('--speed', type=float, default=1.08)
    ap.add_argument('--secs', default='', help='只合成这些段落，如 0,1,2（做样片用）')
    ap.add_argument('--out', default=OUT)
    ap.add_argument('--force', action='store_true', help='跳过多音字核对（不推荐）')
    ap.add_argument('--ref-dir', default=os.path.join(ROOT, 'out', 'voice-ref', 'default'), help='音色参考：ref.wav + ref.txt（make_ref.py 生成）')
    ap.add_argument('--asr', default=os.environ.get('ASR_DIR', '/tmp/claude-0/zv/sherpa-onnx-paraformer-zh-small-2024-03-09'), help='回检用的语音识别模型')
    ap.add_argument('--zipvoice', default=os.environ.get('ZIPVOICE_DIR', '/tmp/claude-0/zv'))
    ap.add_argument('--model-dir', default=os.environ.get('KOKORO_DIR', '/tmp/claude-0/tts/kokoro-int8-multi-lang-v1_1'))
    a = ap.parse_args()
    import subprocess
    chk = subprocess.run([sys.executable, os.path.join(HERE, 'pronounce.py'), '--lexicon', os.path.join(ROOT, 'out', 'tts', 'lexicon.txt')])
    if chk.returncode and not a.force:
        sys.exit('多音字还有「待确认」，先看 08-读音核对表.md，确认后写进 production/pronounce.tsv 再合成')
    gen = zipvoice(a) if a.engine == 'zipvoice' else kokoro(a)
    sr = 24000
    lines = parse(os.path.join(ROOT, '02-脚本-10分钟.md'))
    if a.secs:
        keep = {int(x) for x in a.secs.split(',')}; lines = [l for l in lines if l['sec'] in keep]
    out = a.out; os.makedirs(out, exist_ok=True)
    chunks, t, prev = [np.zeros(int(sr * 0.4), dtype=np.float32)], 0.4, None
    for i, ln in enumerate(lines):
        if ln.get('pause'):
            gap = 0.3
            chunks.append(np.zeros(int(sr * (gap + ln['pause'])), dtype=np.float32))
            ln.update(i=i, start=round(t + gap, 3), end=round(t + gap + ln['pause'], 3)); t += gap + ln['pause'] + 0.3
            chunks.append(np.zeros(int(sr * 0.3), dtype=np.float32)); prev = ln['sec']
            continue
        gap = 0.0 if prev is None else (0.6 if ln['sec'] != prev else 0.12)
        if re.match(r'第[一二三四五]刀', ln['text']):
            gap += 0.25  # 给「刀」的冲击音留位置
        chunks.append(np.zeros(int(sr * gap), dtype=np.float32)); t += gap
        audio = gen(ln['text'])
        s = np.asarray(audio.samples, dtype=np.float32)
        if a.engine == 'zipvoice' and os.path.isdir(a.asr):  # 回检：听写回来和稿子比
            from asr_check import transcribe, check
            heard = transcribe(a.asr, s.tolist(), audio.sample_rate)
            rate, issue = check(say_clone(ln['text']), heard)
            ln.update(heard=heard, err=round(rate, 3), issue=issue)
            if issue:
                print(f'  ⚠ 回检：{issue} ｜ 听到：{heard}', flush=True)
        if audio.sample_rate != sr:
            s = np.interp(np.linspace(0, len(s) - 1, int(len(s) * sr / audio.sample_rate)), np.arange(len(s)), s).astype(np.float32)
        ln.update(i=i, start=round(t, 3), end=round(t + len(s) / sr, 3))
        chunks.append(s); t += len(s) / sr; prev = ln['sec']
        print(f'{i + 1}/{len(lines)} {ln["end"]:.1f}s {ln["text"][:20]}', flush=True)
    chunks.append(np.zeros(int(sr * 1.5), dtype=np.float32)); t += 1.5
    y = np.concatenate(chunks); y = y / (np.abs(y).max() + 1e-9) * 0.9
    sf.write(os.path.join(out, 'voice.wav'), y, sr)
    json.dump({'duration': round(t, 3), 'engine': a.engine, 'speed': a.speed, 'lines': lines},
              open(os.path.join(out, 'timeline.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    with open(os.path.join(out, 'subtitles.srt'), 'w', encoding='utf8') as f:
        k = 0
        for ln in lines:
            if ln['text']:
                k += 1; f.write(f'{k}\n{srt_time(ln["start"])} --> {srt_time(ln["end"])}\n{ln["text"]}\n\n')
    bad = [l for l in lines if l.get('issue')]
    with open(os.path.join(out, 'asr-report.md'), 'w', encoding='utf8') as f:
        f.write(f'# 配音回检报告\n\n共 {sum(1 for l in lines if l["text"])} 句，有问题 {len(bad)} 句。\n\n| 稿子 | 听写 | 问题 |\n|---|---|---|\n')
        for l in bad:
            f.write(f'| {l["text"]} | {l["heard"]} | {l["issue"]} |\n')
    print(f'done {t:.1f}s；回检有问题 {len(bad)} 句 → asr-report.md')

if __name__ == '__main__':
    main()
