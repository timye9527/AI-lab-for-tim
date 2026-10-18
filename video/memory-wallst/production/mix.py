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
SR = 24000  # 和配音同采样率，不做插值；编码时由 ffmpeg 升到 48k

def resample(x, sr_in):
    n = int(len(x) * SR / sr_in)
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)

def env(n, a, r):
    e = np.ones(n, dtype=np.float32); a, r = int(a * SR), int(r * SR)
    e[:a] = np.linspace(0, 1, a); e[-r:] *= np.linspace(1, 0, r); return e

def lowpass(x, fc=2200, taps=63):
    # 窗函数 sinc 低通，滤掉配乐里所有刺耳的高频
    k = np.arange(taps) - (taps - 1) / 2
    h = np.sinc(2 * fc / SR * k) * np.hamming(taps); h /= h.sum()
    return np.convolve(x, h, mode='same').astype(np.float32)

def kick():
    # 单个底鼓：频率从 110Hz 滑到 50Hz，相位按积分算，保证连续不爆音
    tau = np.arange(int(SR * 0.45)) / SR
    phase = 2 * np.pi * (50 * tau + 60 * (1 - np.exp(-30 * tau)) / 30)
    return (np.sin(phase) * np.exp(-tau * 9)).astype(np.float32)

def tense(n, rng):
    t = np.arange(n) / SR
    drone = 0.30 * np.sin(2 * np.pi * 55 * t) + 0.14 * np.sin(2 * np.pi * 82.4 * t)
    drone *= 0.8 + 0.2 * np.sin(2 * np.pi * 0.07 * t)
    pulse = np.zeros(n, dtype=np.float32); k = kick(); step = int(SR * 60 / 96)
    for i in range(0, n, step):
        m = min(len(k), n - i); pulse[i:i + m] += k[:m] * 0.5
    return lowpass((drone + pulse).astype(np.float32), 900)

def calm(n):
    t = np.arange(n) / SR
    chords = [(220.0, 261.6, 329.6), (174.6, 220.0, 261.6), (196.0, 246.9, 293.7), (164.8, 207.7, 246.9)]
    out = np.zeros(n, dtype=np.float32); seg = int(SR * 6)
    for k in range(0, n, seg):
        f = chords[(k // seg) % 4]; m = min(seg, n - k); tt = t[k:k + m]
        tone = sum(np.sin(2 * np.pi * x * tt) + 0.25 * np.sin(4 * np.pi * x * tt) for x in f) / 3
        out[k:k + m] = tone * env(m, 1.5, 1.5) * 0.32
    return lowpass(out + 0.22 * np.sin(2 * np.pi * 55 * t).astype(np.float32), 1800)

def impact(rng):
    n = int(SR * 1.1); tau = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (40 * tau + 90 * (1 - np.exp(-6 * tau)) / 6)) * np.exp(-tau * 3.5)
    return lowpass((boom * 0.9).astype(np.float32), 600)

def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('--audio', default=A)
    ap.add_argument('--picture', default=os.path.join(ROOT, 'out', 'video', 'picture.mp4'))
    ap.add_argument('--out', default=os.path.join(ROOT, 'out', 'final', '存储复盘-一周五刀.mp4'))
    ap.add_argument('--no-music', action='store_true', help='只要人声')
    args = ap.parse_args(); a_dir = args.audio
    tl = json.load(open(os.path.join(a_dir, 'timeline.json'), encoding='utf8'))
    v, sr = sf.read(os.path.join(a_dir, 'voice.wav'), dtype='float32')
    v = resample(v, sr); v = v / (np.abs(v).max() + 1e-9) * 0.89
    n = len(v); rng = np.random.default_rng(7)
    s3 = [l['start'] for l in tl['lines'] if l['sec'] == 3]
    split = int(s3[0] * SR) if s3 else n
    bgm = np.concatenate([tense(split, rng), calm(n - split)]) if split < n else tense(n, rng)
    xf = int(SR * 2)  # 两段之间淡入淡出
    if split < n:
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
    for l in tl['lines']:  # 栏目片头：低频上扬 + 落定
        if l.get('pause'):
            a0, d = int(l['start'] * SR), l['pause']
            m = int(SR * 3.3); tau = np.arange(m) / SR
            rise = np.sin(2 * np.pi * (60 * tau + 160 / (2 * 3.3) * tau ** 2)) * (tau / 3.3) ** 2 * 0.5
            sfx[a0:a0 + m] += lowpass(rise.astype(np.float32), 700)[:max(0, min(m, n - a0))]
            h0 = a0 + int(SR * 3.35); sfx[h0:h0 + len(hit)] += hit[:max(0, min(len(hit), n - h0))] * 0.6
            bgm[a0:a0 + int(d * SR)] *= 0.25
    if args.no_music:
        bgm *= 0; sfx *= 0
    mix = v + bgm + sfx
    mix /= max(1.0, float(np.abs(mix).max()) / 0.95)
    st = np.stack([mix, mix], axis=1)
    sf.write(os.path.join(a_dir, 'mix.wav'), st, SR)
    out = args.out; os.makedirs(os.path.dirname(out), exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', args.picture, '-i', os.path.join(a_dir, 'mix.wav'),
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out], check=True)
    print('done', out)

if __name__ == '__main__':
    main()
