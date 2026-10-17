#!/usr/bin/env python3
"""配乐 + 音效 + 混音（全部代码合成，无版权问题），再和画面合成成片。

前半段（到「长鑫」段之前）：紧张的低频脉冲；后半段：冷静的和弦铺底。
每一「刀」前放一个低频冲击音。人声说话时配乐自动压低。
用法：python3 production/mix.py   → out/final/存储复盘-一周五刀.mp4
"""
import json, os, subprocess
import numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'out', 'audio')
SR = 48000

def resample(x, sr_in):
    n = int(len(x) * SR / sr_in)
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)

def env(n, a, r):
    e = np.ones(n, dtype=np.float32); a, r = int(a * SR), int(r * SR)
    e[:a] = np.linspace(0, 1, a); e[-r:] *= np.linspace(1, 0, r); return e

def tense(n, rng):
    t = np.arange(n) / SR
    drone = 0.35 * np.sin(2 * np.pi * 55 * t) + 0.18 * np.sin(2 * np.pi * 82.4 * t + np.sin(2 * np.pi * 0.1 * t))
    beat = 60 / 96
    ph = (t % beat) / beat
    thump = np.sin(2 * np.pi * (60 * np.exp(-ph * 8)) * t) * np.exp(-ph * 14) * 0.55
    tick = rng.standard_normal(n) * np.exp(-((t + beat / 2) % beat) / beat * 60) * 0.05
    return (drone + thump + tick).astype(np.float32)

def calm(n):
    t = np.arange(n) / SR
    chords = [(220.0, 261.6, 329.6), (174.6, 220.0, 261.6), (196.0, 246.9, 293.7), (164.8, 207.7, 246.9)]
    out = np.zeros(n, dtype=np.float32); seg = int(SR * 6)
    for k in range(0, n, seg):
        f = chords[(k // seg) % 4]; m = min(seg, n - k); tt = t[k:k + m]
        tone = sum(np.sin(2 * np.pi * x * tt) + 0.3 * np.sin(4 * np.pi * x * tt) for x in f) / 3
        out[k:k + m] = tone * env(m, 1.5, 1.5) * 0.35
    return out + 0.25 * np.sin(2 * np.pi * 55 * t).astype(np.float32)

def impact(rng):
    n = int(SR * 1.1); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (40 + 90 * np.exp(-t * 6)) * t) * np.exp(-t * 3.5)
    noise = rng.standard_normal(n) * np.exp(-t * 12) * 0.25
    return ((boom + noise) * 0.9).astype(np.float32)

def main():
    tl = json.load(open(os.path.join(A, 'timeline.json'), encoding='utf8'))
    v, sr = sf.read(os.path.join(A, 'voice.wav'), dtype='float32')
    v = resample(v, sr); v = v / (np.abs(v).max() + 1e-9) * 0.89
    n = len(v); rng = np.random.default_rng(7)
    split = int(next(l['start'] for l in tl['lines'] if l['sec'] == 3) * SR)
    bgm = np.concatenate([tense(split, rng), calm(n - split)])
    xf = int(SR * 2)  # 两段之间淡入淡出
    bgm[split - xf:split] *= np.linspace(1, 0.3, xf); bgm[split:split + xf] *= np.linspace(0.3, 1, xf)
    bgm *= env(n, 1.0, 3.0)
    # 人声压低配乐
    vo = np.zeros(n, dtype=np.float32)
    for l in tl['lines']:
        a, b = int((l['start'] - 0.1) * SR), int((l['end'] + 0.15) * SR); vo[max(a, 0):b] = 1
    k = int(SR * 0.25); vo = np.convolve(vo, np.ones(k) / k, mode='same')
    bgm *= (0.16 - 0.10 * vo)
    sfx = np.zeros(n, dtype=np.float32); hit = impact(rng)
    for l in tl['lines']:
        if l['text'][:2] == '第' + l['text'][1] and l['text'][2:3] == '刀':
            s = int((l['start'] - 0.55) * SR); sfx[s:s + len(hit)] += hit[:max(0, min(len(hit), n - s))] * 0.5
    s0 = int(0.0 * SR); sfx[s0:s0 + len(hit)] += hit * 0.35  # 开场一记
    mix = v + bgm + sfx
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    st = np.stack([mix, mix], axis=1)
    sf.write(os.path.join(A, 'mix.wav'), st, SR)
    os.makedirs(os.path.join(ROOT, 'out', 'final'), exist_ok=True)
    out = os.path.join(ROOT, 'out', 'final', '存储复盘-一周五刀.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(ROOT, 'out', 'video', 'picture.mp4'), '-i', os.path.join(A, 'mix.wav'),
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], check=True)
    print('done', out)

if __name__ == '__main__':
    main()
