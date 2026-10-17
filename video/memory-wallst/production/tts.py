#!/usr/bin/env python3
"""口播配音：读 02 脚本的口播行，逐句合成，输出整轨 + 时间轴 + 字幕。

用法：python3 production/tts.py [--sid 3] [--speed 1.05] [--model-dir DIR]
依赖：pip install sherpa-onnx soundfile numpy；模型 kokoro-int8-multi-lang-v1_1（sherpa-onnx tts-models 发布页）
输出：out/audio/voice.wav、out/audio/timeline.json、out/audio/subtitles.srt
"""
import argparse, json, re, os, sys
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'out', 'audio')

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

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sid', type=int, default=3)
    ap.add_argument('--speed', type=float, default=1.05)
    ap.add_argument('--model-dir', default=os.environ.get('KOKORO_DIR', '/tmp/claude-0/tts/kokoro-int8-multi-lang-v1_1'))
    a = ap.parse_args()
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
    sr = tts.sample_rate
    lines = parse(os.path.join(ROOT, '02-脚本-10分钟.md'))
    os.makedirs(OUT, exist_ok=True)
    chunks, t, prev = [np.zeros(int(sr * 0.6), dtype=np.float32)], 0.6, None
    for i, ln in enumerate(lines):
        gap = 0.0 if prev is None else (0.9 if ln['sec'] != prev else 0.2)
        if re.match(r'第[一二三四五]刀', ln['text']):
            gap += 0.6  # 给「刀」的冲击音留位置
        chunks.append(np.zeros(int(sr * gap), dtype=np.float32)); t += gap
        audio = tts.generate(say(ln['text']), sid=a.sid, speed=a.speed)
        s = np.asarray(audio.samples, dtype=np.float32)
        ln.update(i=i, start=round(t, 3), end=round(t + len(s) / sr, 3))
        chunks.append(s); t += len(s) / sr; prev = ln['sec']
        print(f'{i + 1}/{len(lines)} {ln["end"]:.1f}s {ln["text"][:20]}', flush=True)
    chunks.append(np.zeros(int(sr * 2.0), dtype=np.float32)); t += 2.0
    sf.write(os.path.join(OUT, 'voice.wav'), np.concatenate(chunks), sr)
    json.dump({'duration': round(t, 3), 'sid': a.sid, 'speed': a.speed, 'lines': lines},
              open(os.path.join(OUT, 'timeline.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    with open(os.path.join(OUT, 'subtitles.srt'), 'w', encoding='utf8') as f:
        for k, ln in enumerate(lines, 1):
            f.write(f'{k}\n{srt_time(ln["start"])} --> {srt_time(ln["end"])}\n{ln["text"]}\n\n')
    print(f'done {t:.1f}s')

if __name__ == '__main__':
    main()
