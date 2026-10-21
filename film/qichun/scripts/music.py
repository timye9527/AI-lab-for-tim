# 生成配乐：五声音阶的长音铺底 + 稀疏拨弦，全部程序合成，无版权问题
# 用法：python music.py <秒数> <输出.wav>
import sys, wave
import numpy as np

SR = 44100
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 156
OUT = sys.argv[2] if len(sys.argv) > 2 else "out/music.wav"
rng = np.random.default_rng(3)
n = int(SR * DUR)
t = np.arange(n) / SR
L = np.zeros(n); R = np.zeros(n)

def hz(m):
    return 440 * 2 ** ((m - 69) / 12)

# D 宫五声：D E F# A B
scale = [62, 64, 66, 69, 71]
# 每段的和声（MIDI），跟着片子的章节换
chords = [(0, [38, 50, 57, 62]), (26, [35, 47, 54, 59]), (52, [43, 50, 55, 62]),
          (79, [38, 50, 57, 64]), (110, [40, 47, 52, 59]), (122, [38, 45, 54, 62]), (146, [38, 50, 57, 62])]

def env(a, b, fade=3.0):
    e = np.clip((t - a) / fade, 0, 1) * np.clip((b - t) / fade, 0, 1)
    return e * e * (3 - 2 * e)

for i, (a, notes) in enumerate(chords):
    b = chords[i + 1][0] + 3 if i + 1 < len(chords) else DUR
    e = env(a - 1.5, b, 3.5)
    for k, m in enumerate(notes):
        f = hz(m)
        for det, pan in ((-0.12, 0.3), (0.12, 0.7)):
            ph = rng.random() * 6.28
            lfo = 1 + 0.002 * np.sin(2 * np.pi * (0.07 + 0.03 * k) * t + ph)
            v = np.sin(2 * np.pi * (f + det) * lfo * t + ph) + 0.25 * np.sin(4 * np.pi * (f + det) * t + ph)
            amp = 0.05 / (1 + k * 0.4)
            L += v * e * amp * (1 - pan); R += v * e * amp * pan

# 拨弦（Karplus-Strong），落在五声音阶上
def pluck(f, dur=3.5):
    N = int(SR / f); buf = rng.uniform(-1, 1, N); out = np.zeros(int(SR * dur))
    for i in range(len(out)):
        out[i] = buf[i % N]
        buf[i % N] = 0.996 * 0.5 * (buf[i % N] + buf[(i + 1) % N])
    return out * np.exp(-np.arange(len(out)) / SR * 1.2)

tt = 4.0
while tt < DUR - 8:
    m = scale[rng.integers(len(scale))] + 12 * rng.integers(0, 2)
    p = pluck(hz(m)) * 0.10
    s = int(tt * SR); e = min(n, s + len(p)); pan = rng.uniform(0.25, 0.75)
    L[s:e] += p[:e - s] * (1 - pan); R[s:e] += p[:e - s] * pan
    tt += rng.choice([1.5, 2.25, 3.0, 4.5])

# 简单混响：几路衰减延时
def verb(x):
    y = x.copy()
    for d, g in ((0.031, .35), (0.047, .3), (0.071, .25), (0.113, .2), (0.173, .15)):
        k = int(d * SR * 4); y[k:] += x[:-k] * g
    return y
L, R = verb(L), verb(R)
master = np.clip(t / 2.5, 0, 1) * np.clip((DUR - t) / 5, 0, 1)
st = np.stack([L * master, R * master], 1)
st = st / np.abs(st).max() * 0.7
with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype("<i2").tobytes())
print("music", OUT, DUR)
