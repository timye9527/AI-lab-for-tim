#!/usr/bin/env python3
"""原创配乐 + 音效 + 配音混音 → out/film/audio.wav（-14 LUFS，真峰值 ≤ -1 dBTP）

  python3 production/mix.py            → 混音
  python3 production/mix.py --stem music  → 只导出配乐（混音前单独检查配乐，错误档案「零」第 12 条）
全部用 numpy 现算，不用任何采样或曲库：
  主题（县城喜庆，唢呐感的锯齿波 + 颤音）、小李主题（拨弦，Karplus-Strong）、AI 主题（钢片琴，正弦钟声）、
  垫底和弦、低音、反转音（锣 + 上扬）、转场嗖声、金币叮当、唱片刮擦。
防「电波杂音」（存储视频 v1 的坑）：所有变频的音都按瞬时频率积分算相位，不用「频率 × 绝对时间」。
"""
import json, os, subprocess, sys
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
SR = 48000
TL = json.load(open(os.path.join(ROOT, 'out', 'film', 'timeline.json'), encoding='utf8'))
DUR = TL['duration'] + 0.5
N = int(DUR * SR)
rs = np.random.default_rng(7)

def midi(m): return 440.0 * 2 ** ((m - 69) / 12)

def env(n, a=0.01, d=0.1, s=0.7, r=0.2):
    e = np.ones(n) * s
    ia, idd, ir = int(a * SR), int(d * SR), int(r * SR)
    ia = min(ia, n); e[:ia] = np.linspace(0, 1, ia, endpoint=False) if ia else e[:ia]
    if ia + idd < n: e[ia:ia + idd] = np.linspace(1, s, idd, endpoint=False)
    if ir and ir < n: e[-ir:] *= np.linspace(1, 0, ir)
    return e

def phase(freq):
    # 瞬时频率积分 → 相位（freq 可以是数组）
    return 2 * np.pi * np.cumsum(freq) / SR

def lowpass(x, fc):
    # 一阶低通，够用来去掉锯齿波的刺耳高频
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); z = 0.0
    for i in range(len(x)):
        z = (1 - a) * x[i] + a * z; y[i] = z
    return y

def lp_fast(x, fc):
    # 向量化的低通：用 FFT 做软滚降，长信号用这个
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / fc) ** 4)
    return np.fft.irfft(X, len(x))

# ── 乐器 ──
def shanai(m, dur, vib=5.5):
    n = int(dur * SR); t = np.arange(n) / SR
    f = midi(m) * (1 + 0.012 * np.sin(2 * np.pi * vib * t) * np.clip(t / 0.15, 0, 1))
    p = phase(f)
    x = sum(np.sin(k * p) / k for k in range(1, 9))  # 带限锯齿
    x = lp_fast(x, 2600) * env(n, 0.03, 0.1, 0.8, 0.08)
    return x * 0.5

def pluck(m, dur, bright=0.5):
    # Karplus-Strong 拨弦
    n = int(dur * SR); P = int(SR / midi(m))
    buf = rs.uniform(-1, 1, P); out = np.empty(n)
    for i in range(n):
        out[i] = buf[i % P]
        buf[i % P] = 0.996 * (bright * buf[i % P] + (1 - bright) * 0.5 * (buf[i % P] + buf[(i + 1) % P]))
    return out * env(n, 0.002, 0.05, 1, 0.05) * 0.6

def bell(m, dur):
    # 钢片琴：正弦 + 不谐和泛音，指数衰减
    n = int(dur * SR); t = np.arange(n) / SR; f = midi(m)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 10)
    return x * np.exp(-t * 3.2) * env(n, 0.002, 0.01, 1, 0.05) * 0.35

def marimba(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR; f = midi(m)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 18)
    return x * np.exp(-t * 7) * env(n, 0.003, 0.01, 1, 0.03) * 0.45

def pad(ms, dur):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for m in ms:
        for det in (-0.08, 0.0, 0.07):
            p = phase(np.full(n, midi(m + det)))
            x += sum(np.sin(k * p) / k for k in range(1, 6))
    x = lp_fast(x, 1400) / (len(ms) * 3)
    return x * env(n, 0.6, 0.2, 0.9, 0.8) * 0.5

def bass(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * midi(m) * t) + 0.3 * np.sin(4 * np.pi * midi(m) * t)
    return x * env(n, 0.01, 0.1, 0.7, 0.1) * 0.5

def kick():
    # 底鼓：频率从 120 降到 45，按积分相位（存储视频 v1 的电波声就是这里写错了）
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 45 + 75 * np.exp(-t * 30)
    return np.sin(phase(f)) * np.exp(-t * 9) * 0.9

def gong(dur=2.4):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for f, d in ((110, 1.4), (167, 1.8), (231, 2.4), (329, 3.2), (447, 4.0), (612, 5.0)):
        x += np.sin(2 * np.pi * f * t + rs.uniform(0, 6)) * np.exp(-t * d)
    return x / 4 * env(n, 0.005, 0.05, 1, 0.3)

def rise(dur=0.6):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 300 * 2 ** (t / dur * 2)
    return np.sin(phase(f)) * np.linspace(0, 1, n) ** 2 * env(n, 0.01, 0.01, 1, 0.05) * 0.4

def whoosh(dur=0.5):
    n = int(dur * SR)
    x = rs.normal(0, 1, n); x = lp_fast(x, 1800) * np.sin(np.linspace(0, np.pi, n)) ** 2
    return x * 0.25

def ding(m=96):
    return bell(m, 0.8) * 1.2

def scratch(dur=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 900 * np.exp(-t * 5) + 120
    return (np.sin(phase(f)) * 0.5 + lp_fast(rs.normal(0, 0.3, n), 3000)) * np.exp(-t * 4) * 0.35

def add(buf, x, t0, g=1.0):
    i = int(t0 * SR)
    if i >= len(buf) or i + len(x) <= 0: return
    j = min(len(buf), i + len(x)); buf[max(0, i):j] += g * x[max(0, -i):j - i]

# ── 编曲：按幕铺 ──
shots = {s['id']: s for s in TL['shots']}
def sh(id_): return shots[id_]['start'], shots[id_]['end']
music = np.zeros(N); sfx = np.zeros(N)
BPM = 100; beat = 60 / BPM
PENTA = [0, 2, 4, 7, 9]  # 五声音阶，县城喜庆味
def scale(deg, base=72): return base + PENTA[deg % 5] + 12 * (deg // 5)

THEME = [(4, 1), (5, 0.5), (4, 0.5), (2, 1), (0, 1), (2, 0.5), (4, 0.5), (5, 1), (4, 2)]  # 主题旋律（原创）
CHORDS = [[60, 64, 67], [57, 60, 64], [62, 65, 69], [55, 59, 62]]  # C Am Dm G

def theme(t0, t1, inst=shanai, base=72, gain=0.5, every=1):
    t = t0
    while t < t1 - 0.5:
        for deg, b in THEME:
            if t >= t1: break
            add(music, inst(scale(deg, base), b * beat * 0.95), t, gain); t += b * beat
        t += beat * 2

def groove(t0, t1, gain=0.35, kickit=True, chords=CHORDS):
    t, k = t0, 0
    while t < t1:
        ch = chords[k % len(chords)]
        add(music, pad(ch, min(4 * beat, t1 - t) + 0.6), t, gain * 0.7)
        for b in range(4):
            tb = t + b * beat
            if tb >= t1: break
            add(music, bass(ch[0] - 24, beat * 0.9), tb, gain * 0.8)
            if kickit and b % 2 == 0: add(music, kick(), tb, gain * 0.6)
            add(music, marimba(ch[(b + 1) % 3] + 12, beat * 0.8), tb + beat / 2, gain * 0.5)
        t += 4 * beat; k += 1

def sparkle(t0, t1, gain=0.3):
    t = t0; i = 0
    while t < t1:
        add(music, bell(scale([4, 7, 5, 9, 6, 8][i % 6], 79), 1.2), t, gain); t += beat / 2; i += 1

def plucks(t0, t1, gain=0.4, base=60):
    t = t0; i = 0
    pat = [0, 2, 4, 2, 5, 4, 2, 4]
    while t < t1:
        add(music, pluck(scale(pat[i % 8], base), beat * 0.6), t, gain); t += beat / 2; i += 1

def drone(t0, t1, m=40, gain=0.3):
    add(music, pad([m, m + 7], t1 - t0 + 0.5), t0, gain)

# 开场：喜庆主题 → 一年后抽掉 → 悬疑 → 标题鼓点
a, b = sh('C01')[0], sh('C04')[1]; theme(a + 0.2, b, gain=0.42); groove(a, b, 0.32)
drone(sh('C05')[0], sh('C07')[1], 38, 0.28)
plucks(sh('C07')[0], sh('C07')[1], 0.25, 48)
t8 = shots['C08']['lines'][0]['end']
for k in range(3): add(sfx, kick(), t8 + 0.25 + k * 0.18, 0.8)
add(sfx, gong(1.6), t8 + 0.8, 0.35)
# 第一幕：轻快
a, b = sh('C09')[0], sh('C15')[1]; groove(a, b, 0.3); theme(a + 2 * beat, b, inst=marimba, base=72, gain=0.35)
# 第二幕：AI 钢片琴 → 欢快 → C26 急停 → C27 低音
a, b = sh('C16')[0], sh('C25')[1]; groove(a, b, 0.28); sparkle(a, sh('C22')[1], 0.22); theme(sh('C24')[0], b, gain=0.36)
drone(sh('C27')[0], sh('C27')[1] + 0.5, 36, 0.32)
# 第三幕：小李拨弦 + 压迫低音
a, b = sh('C28')[0], sh('C38')[1]; plucks(a, b, 0.3, 60); groove(a, b, 0.24, chords=[[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]])
# 第四幕：中性、稳
a, b = sh('C39')[0], sh('C45')[1]; groove(a, b, 0.26, kickit=False); sparkle(sh('C40')[0], sh('C40')[1], 0.15)
# 第五幕：拨弦升调 → 高潮
a, b = sh('C46')[0], sh('C54')[1]; plucks(a, b, 0.28, 62); groove(a, b, 0.3); theme(sh('C53')[0], b, inst=shanai, base=74, gain=0.4)
# 尾声：温暖收尾
a, b = sh('C55')[0], TL['duration']; groove(a, sh('C60')[1], 0.22, kickit=False)
add(music, pad([60, 64, 67, 72], b - sh('C61')[0] + 1), sh('C61')[0], 0.32)
theme(sh('C63')[0], b - 1.0, inst=marimba, base=72, gain=0.32)

# ── 音效 ──
rev = []
for r in ('rev1', 'rev2', 'rev3'):
    s = next(x for x in TL['shots'] if r in x['tag']); l = s['lines'][-1]
    tr = l['start'] + (l['end'] - l['start']) * 0.7; rev.append(tr)
    add(sfx, rise(0.5), tr - 0.5, 0.5); add(sfx, gong(), tr, 0.55)
    # 反转前抽掉音乐半拍
    i0, i1 = int((tr - 0.6) * SR), int((tr + 0.15) * SR); music[i0:i1] *= np.linspace(1, 0.15, i1 - i0)
prev = None
for s in TL['shots']:
    if prev and prev['act'] != s['act']: add(sfx, whoosh(0.5), s['start'] - 0.25, 0.6)
    prev = s
for id_ in ('C02', 'C16'): add(sfx, ding(91), shots[id_]['start'] + 0.5, 0.5)
for id_, n in (('C04', 6), ('C37', 8), ('C51', 10)):
    s0, s1 = sh(id_)
    for k in range(n): add(sfx, ding(96 + (k % 3) * 2), s0 + 0.8 + k * (s1 - s0 - 1.2) / n, 0.18)
add(sfx, scratch(), sh('C26')[0], 0.7)
i0 = int(sh('C26')[0] * SR); i1 = int(sh('C26')[1] * SR); music[i0:i1] *= 0.05  # 急停
for id_ in ('C10', 'C28'): add(sfx, whoosh(0.3), shots[id_]['start'] + 0.4, 0.4)

# ── 配音 ──
voice = np.zeros(N)
for s in TL['shots']:
    for l in s['lines']:
        x, sr = sf.read(os.path.join(ROOT, l['wav']), dtype='float32')
        if x.ndim > 1: x = x.mean(1)
        assert sr == SR, l['wav']
        add(voice, x, l['start'])

stem = sys.argv[sys.argv.index('--stem') + 1] if '--stem' in sys.argv else ''
out_dir = os.path.join(ROOT, 'out', 'film'); os.makedirs(out_dir, exist_ok=True)
music = music / (np.abs(music).max() + 1e-9)
if stem == 'music':
    sf.write(os.path.join(out_dir, 'music.wav'), (music * 0.8).astype(np.float32), SR); print('配乐 →', out_dir + '/music.wav'); sys.exit()

# 人声在时压低配乐（侧链，平滑 150ms）
venv = np.convolve(np.abs(voice), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same')
gate = np.clip(venv / 0.02, 0, 1)
k = int(0.15 * SR); gate = np.convolve(gate, np.ones(k) / k, 'same')
duck = 1 - 0.55 * gate
vpk = np.abs(voice).max()
mix = voice / vpk * 0.8 + music * 0.13 * duck + sfx * 0.35
mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
raw = os.path.join(out_dir, 'audio-raw.wav'); sf.write(raw, mix.astype(np.float32), SR)
# 响度统一：-14 LUFS，真峰值 ≤ -1 dBTP（两遍 loudnorm）
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', raw, '-af', af, '-ar', str(SR), os.path.join(out_dir, 'audio.wav')], check=True)
print('混音 →', out_dir + '/audio.wav', f'（时长 {DUR:.1f}s，反转音 {[round(x, 1) for x in rev]}）')
