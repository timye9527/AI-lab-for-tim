"""背景音乐：程序合成的安静铺底（和弦长音 + 稀疏的高音点缀），没有版权问题，同一时长每次生成都一样。

用法：python3 bgm.py <输出.wav> <秒数>
混音在 build.mjs：音乐压得很低，人声一出来再自动让开（侧链压缩）。
"""
import sys
import wave

import numpy as np

SR = 44100
# 小调四和弦循环：Am → F → C → G，每个和弦 8 秒
CHORDS = [
    [110.00, 130.81, 164.81, 220.00],
    [87.31, 110.00, 130.81, 174.61],
    [130.81, 164.81, 196.00, 261.63],
    [98.00, 123.47, 146.83, 196.00],
]
BAR = 8.0
FADE = 2.0
# 点缀音：A 小调五声音阶，高两个八度
BELLS = [440.00, 523.25, 587.33, 659.25, 783.99, 880.00]


def tone(f, t):
    # 两个略微失谐的振荡器叠在一起，听起来更暖；只加少量泛音
    out = np.zeros_like(t)
    for d in (-0.4, 0.4):
        w = 2 * np.pi * (f + d) * t
        out += np.sin(w) + 0.25 * np.sin(2 * w) + 0.08 * np.sin(3 * w)
    return out / 2


def render(seconds):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    pad = np.zeros(n)
    k = 0
    start = 0.0
    while start < seconds:
        a, b = int(max(start - FADE, 0) * SR), int(min(start + BAR + FADE, seconds) * SR)
        seg = t[a:b]
        env = np.ones_like(seg)
        rise = np.clip((seg - (start - FADE)) / (2 * FADE), 0, 1)
        fall = np.clip(((start + BAR + FADE) - seg) / (2 * FADE), 0, 1)
        env *= 0.5 - 0.5 * np.cos(np.pi * np.minimum(rise, fall))
        chord = CHORDS[k % len(CHORDS)]
        pad[a:b] += env * sum(tone(f, seg) for f in chord) / len(chord)
        k += 1
        start += BAR
    pad *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.07 * t)  # 很慢的起伏

    # 点缀：每 2 秒一个，固定随机种子，音量很低，快速衰减
    rng = np.random.default_rng(7)
    bells = np.zeros(n)
    for s in np.arange(1.0, seconds - 3, 2.0):
        if rng.random() < 0.35:
            continue
        f = BELLS[rng.integers(len(BELLS))]
        a = int(s * SR)
        m = min(int(3 * SR), n - a)
        tt = np.arange(m) / SR
        bells[a:a + m] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 2.2) * np.minimum(tt / 0.01, 1)

    mix = pad + 0.18 * bells
    # 简单低通，去掉刺耳的高频
    kern = np.ones(6) / 6
    mix = np.convolve(mix, kern, mode='same')
    # 首尾淡入淡出
    fade = int(2 * SR)
    mix[:fade] *= np.linspace(0, 1, fade)
    mix[-fade:] *= np.linspace(1, 0, fade)
    return mix / np.max(np.abs(mix)) * 0.89


def main():
    out, seconds = sys.argv[1], float(sys.argv[2])
    data = (render(seconds) * 32767).astype(np.int16)
    with wave.open(out, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


if __name__ == '__main__':
    main()
