# 配乐 + 音效：按时间轴编曲，用 GeneralUser GS 音色库渲染；音效全部程序合成
# 用法：python score.py <timeline.json> <音色库.sf2> <输出目录>
import sys, json, math
import numpy as np, soundfile as sf
import tinysoundfont

TL = json.load(open(sys.argv[1]))
SF2, OUT = sys.argv[2], sys.argv[3]
SR = 48000
DUR = TL["duration"] + 1.0
seg = {s["id"]: s for s in TL["segments"]}
rng = np.random.default_rng(11)

# ---------- 乐谱 ----------
CH = dict(strings=0, koto=1, lead=2, choir=3, harp=4, taiko=5, timp=6, piano=7, horn=8, bell=10, bass=11)
PROG = dict(strings=49, koto=107, lead=77, choir=52, harp=46, taiko=116, timp=47, piano=0, horn=60, bell=14, bass=49)
ev = []   # (时间, 序号, 类型, 参数...)

def note(t, ch, key, dur, vel):
    ev.append((t, 1, "on", CH[ch], key, int(np.clip(vel, 1, 127))))
    ev.append((t + dur, 0, "off", CH[ch], key, 0))

def expr(ch, t0, t1, v0, v1, step=0.05):
    """表情控制（CC11）做渐强渐弱"""
    n = max(1, int((t1 - t0) / step))
    for i in range(n + 1):
        u = i / n
        ev.append((t0 + (t1 - t0) * u, 0, "cc", CH[ch], 11, int(v0 + (v1 - v0) * (u * u * (3 - 2 * u)))))

def prog(t, ch, p):
    ev.append((t, -1, "prog", CH[ch], p, 0))

D = 62  # D4
# D 宫五声：D E F# A B
PENTA = [0, 2, 4, 7, 9]
def pk(deg, base=D):
    o, d = divmod(deg, 5)
    return base + 12 * o + PENTA[d]

CHORDS = {"D": [38, 50, 57, 62, 66], "Bm": [35, 47, 54, 59, 62], "G": [31, 43, 50, 55, 59], "A": [33, 45, 52, 57, 61],
          "Em": [28, 40, 47, 52, 55], "F#m": [30, 42, 49, 54, 57]}

def pad(t0, t1, seq, vel=70, ch="strings", top=True):
    """弦乐长音铺底：seq 是和弦名列表，均分时长"""
    L = (t1 - t0) / len(seq)
    for i, c in enumerate(seq):
        for k in CHORDS[c][(0 if top else 1):]:
            note(t0 + i * L, ch, k, L + 0.25, vel - (8 if k < 45 else 0))

def koto_arp(t0, t1, beat, pattern, vel=70, base=D):
    t, i = t0, 0
    while t < t1 - 0.05:
        d = pattern[i % len(pattern)]
        if d is not None:
            note(t, "koto", pk(d, base), beat * 2.5, vel + rng.integers(-8, 8))
        t += beat; i += 1

def melody(t0, beat, notes, ch="lead", vel=80, base=D):
    """notes: [(五声级数, 拍数)]，级数 None 为休止"""
    t = t0
    for d, b in notes:
        if d is not None:
            note(t, ch, pk(d, base), beat * b * 0.98, vel + rng.integers(-5, 5))
        t += beat * b
    return t

THEME = [(3, 1), (4, 1), (5, 2), (6, 1), (5, 1), (4, 1), (3, 1), (2, 1), (3, 1), (4, 2), (3, 1), (2, 1), (1, 1), (0, 3)]
THEME_B = [(5, 1), (6, 1), (7, 2), (6, 1), (5, 1), (4, 2), (3, 1), (4, 1), (5, 1), (3, 1), (2, 4)]

for c, p in PROG.items():
    prog(0, c, p)
    ev.append((0, -1, "cc", CH[c], 7, 100))
    ev.append((0, -1, "cc", CH[c], 11, 100))

beat = 60 / 66

# 1 开场：低音长音 + 尺八
o = seg["open"]
pad(0.3, seg["title"]["start"] + 0.5, ["D"], vel=52, ch="bass", top=False)
expr("bass", 0, 3, 20, 95)
melody(2.2, beat * 1.3, [(3, 3), (2, 1), (1, 2), (None, 1), (2, 2), (3, 4)], vel=72, base=D - 12)
koto_arp(5.0, o["end"], beat * 2, [0, None, 4, None, 7, None, None, None], vel=55, base=D - 12)

# 2 片名：大和弦铺开，竖琴刮奏，太鼓一击，钟
ti = seg["title"]
note(ti["start"], "taiko", 45, 2, 110); note(ti["start"], "timp", 38, 3, 90)
note(ti["start"] + 0.05, "bell", 74, 4, 70)
for i in range(16):
    note(ti["start"] + i * 0.06, "harp", pk(i, D - 12), 2.5, 70)
pad(ti["start"], ti["end"] + 0.6, ["D"], vel=78)
expr("strings", ti["start"], ti["start"] + 1.5, 60, 110)
note(ti["start"], "choir", 62, ti["dur"], 60); note(ti["start"], "choir", 69, ti["dur"], 60)

# 3 地理：古筝分解和弦 + 长笛主题
g = seg["geo"]
prog(g["start"] - 0.1, "lead", 73)
pad(g["start"], g["end"], ["D", "Bm", "G", "A"], vel=66)
koto_arp(g["start"], g["end"], beat / 2, [0, 2, 4, 5, 7, 5, 4, 2], vel=62)
melody(g["start"] + 2 * beat, beat, THEME, vel=76, base=D)

# 4 西周：小调色彩，低沉
z = seg["zhou"]
prog(z["start"] - 0.1, "lead", 77)
pad(z["start"], z["end"], ["Bm", "G", "Bm", "F#m"], vel=60)
koto_arp(z["start"], z["end"], beat, [4, None, 2, 4, None, 7, 5, None], vel=58, base=D - 12)
melody(z["start"] + 1.5, beat * 1.5, [(4, 2), (3, 1), (2, 1), (1, 3), (None, 1), (2, 1), (3, 1), (4, 2), (2, 4)], vel=70, base=D - 12)
note(z["start"], "timp", 35, 3, 60)

# 5 汉唐：笛子主题 B，竖琴点缀
h0, h1 = seg["han"]["start"], seg["tang"]["end"]
prog(h0 - 0.1, "lead", 73)
pad(h0, h1, ["G", "D", "Em", "A", "D"], vel=64)
koto_arp(h0, h1, beat / 2, [0, 4, 2, 4, 5, 4, 2, 4], vel=56)
melody(h0 + 1.0, beat, THEME_B, vel=78)
melody(h0 + 1.0 + beat * 16, beat, THEME[:8], vel=74)
for i in range(0, int((h1 - h0) / (beat * 4))):
    note(h0 + i * beat * 4, "harp", pk(7 + (i % 3)), 3, 50)

# 6 蕲州 / 李时珍：弦乐加厚，人声铺底，定音鼓滚奏
q0, q1 = seg["qizhou"]["start"], seg["li"]["end"]
pad(q0, q1, ["D", "G", "Bm", "A"], vel=74)
expr("strings", q0, q0 + 3, 80, 115)
for c, k in [(q0, 62), (q0, 66), (q0, 69)]:
    note(c, "choir", k, q1 - q0, 55)
melody(q0 + 2.0, beat, THEME, vel=80)
for i in range(int((q1 - q0) / 0.12)):
    note(q0 + i * 0.12, "timp", 38, 0.2, 30 + int(30 * math.sin(math.pi * i * 0.12 / (q1 - q0))))

# 7 本草：钢琴和古筝，轻
b0, b1 = seg["herbs"]["start"], seg["book"]["end"]
pad(b0, b1, ["G", "D", "Em", "D", "A", "D"], vel=56)
expr("strings", b0, b0 + 2, 100, 70)
t = b0 + 0.5
pat = [0, 4, 7, 9, 12, 9, 7, 4]
while t < b1 - 1:
    for i, d in enumerate(pat):
        note(t + i * beat / 2, "piano", 50 + d, beat * 2, 46 + (10 if i == 0 else 0))
    t += beat * 4
melody(b0 + 4, beat * 1.2, [(5, 2), (4, 1), (3, 1), (4, 3), (None, 1), (3, 1), (2, 1), (1, 1), (2, 1), (3, 4)], ch="lead", vel=68)
note(seg["book"]["start"] + seg["book"]["stampT"] if "stampT" in seg["book"] else b1 - 4, "taiko", 45, 2, 70)

# 8 风物：节奏起来，太鼓轻打
f0, f1 = seg["treasures"]["start"], seg["pottery"]["end"]
bt = 60 / 80
pad(f0, f1, ["D", "A", "Bm", "G", "D", "A"], vel=66)
expr("strings", f0, f0 + 2, 70, 100)
koto_arp(f0, f1, bt / 2, [0, 2, 4, 7, 4, 2, 5, 4], vel=64)
t = f0
while t < f1 - 0.5:
    note(t, "taiko", 45, 1, 72); note(t + bt * 1.5, "taiko", 48, 1, 50); note(t + bt * 2, "taiko", 45, 1, 60)
    t += bt * 4
prog(f0, "lead", 75)
melody(f0 + bt * 4, bt, THEME + THEME_B, vel=80)

# 9 人物：独奏，留白
p0, p1 = seg["people"]["start"], seg["people"]["end"]
prog(p0 - 0.1, "lead", 77)
pad(p0, p1, ["Bm", "G"], vel=58)
expr("strings", p0, p0 + 1.5, 100, 72)
melody(p0 + 0.6, beat * 1.4, [(4, 2), (5, 1), (4, 1), (3, 2), (2, 2), (3, 4)], vel=74)

# 10 今天：高潮，圆号、合唱、太鼓
n0, n1 = seg["now"]["start"], seg["end"]["end"]
bt = 60 / 76
note(n0, "taiko", 41, 2, 120); note(n0, "timp", 38, 3, 110)
pad(n0, n1, ["D", "G", "A", "D", "Bm", "G", "A", "D"], vel=82)
expr("strings", n0, n0 + 2, 90, 120)
for k in (50, 57, 62):
    note(n0 + 2, "horn", k, (n1 - n0) / 2, 72)
    note(n0 + 2 + (n1 - n0) / 2, "horn", k + 5 if k != 62 else 62, (n1 - n0) / 2, 76)
for k in (62, 66, 69, 74):
    note(n0 + 1, "choir", k, n1 - n0, 66)
koto_arp(n0, n1, bt / 2, [0, 4, 7, 9, 12, 9, 7, 4], vel=70)
t = n0 + bt * 4
while t < n1 - 2:
    note(t, "taiko", 45, 1, 92); note(t + bt, "taiko", 45, 1, 60); note(t + bt * 2, "taiko", 48, 1, 80); note(t + bt * 3.5, "taiko", 45, 1, 55)
    t += bt * 4
prog(n0, "lead", 73)
melody(n0 + bt * 4, bt, [(d + 5 if d is not None else None, b) for d, b in THEME] + THEME_B, vel=88)
expr("strings", n1 - 3, n1 + 0.5, 120, 70)

# 11 尾声：回到开头的尺八，主和弦收住
e0, e1 = seg["outro"]["start"], seg["outro"]["end"]
prog(e0 - 0.2, "lead", 77)
note(e0, "bell", 74, 6, 64); note(e0, "taiko", 45, 3, 80)
pad(e0, e1 + 1, ["D"], vel=64)
expr("strings", e0, e1, 100, 0)
melody(e0 + 1.2, beat * 1.4, THEME[-6:], vel=70)
for i in range(12):
    note(e1 - 5 + i * 0.09, "harp", pk(i, D - 12), 4, 52)

# ---------- 渲染 ----------
synth = tinysoundfont.Synth(samplerate=SR, gain=-6)
sfid = synth.sfload(SF2)
ev.sort(key=lambda e: (e[0], e[1]))
total = int(SR * DUR)
out = np.zeros((total, 2), np.float32)
pos = 0
for e in ev:
    tgt = min(total, int(e[0] * SR))
    if tgt > pos:
        buf = np.frombuffer(synth.generate(tgt - pos), dtype=np.float32).reshape(-1, 2)
        out[pos:tgt] = buf; pos = tgt
    kind, ch = e[2], e[3]
    if kind == "prog":
        synth.program_select(ch, sfid, 0, e[4], is_drums=False)
    elif kind == "on":
        synth.noteon(ch, e[4], e[5])
    elif kind == "off":
        synth.noteoff(ch, e[4])
    elif kind == "cc":
        synth.control_change(ch, e[4], e[5])
if pos < total:
    out[pos:] = np.frombuffer(synth.generate(total - pos), dtype=np.float32).reshape(-1, 2)
sf.write(f"{OUT}/music_dry.wav", out, SR)
print("music", round(DUR, 1), "s, peak", float(np.abs(out).max()))

# ---------- 音效（程序合成） ----------
n = total
sfx = np.zeros((n, 2), np.float32)
tt = np.arange(n) / SR

def win(t0, t1, fade=1.0):
    a = np.clip((tt - t0) / fade, 0, 1) * np.clip((t1 - tt) / fade, 0, 1)
    return a * a * (3 - 2 * a)

def colored(n, alpha):
    """1/f^alpha 噪声"""
    X = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR); f[0] = 1
    y = np.fft.irfft(X / f ** (alpha / 2), n)
    return (y / np.abs(y).max()).astype(np.float32)

def bandnoise(n, lo, hi):
    X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(X, n); return (y / (np.abs(y).max() + 1e-9)).astype(np.float32)

def add(sig, gain, pan=0.5):
    sfx[:, 0] += sig * gain * (1 - pan) * 2 ** 0.5 * 0.7
    sfx[:, 1] += sig * gain * pan * 2 ** 0.5 * 0.7

brown = colored(n, 2.0)
pink = colored(n, 1.0)
slow = lambda f, ph=0: 0.6 + 0.4 * np.sin(2 * np.pi * f * tt + ph)

# 风：山水、片名、艾田
for k in ("title", "zhou", "field", "outro"):
    s = seg[k]; add(brown * win(s["start"] - 0.8, s["end"] + 0.8, 1.5) * slow(0.13), 0.10)
# 水：干栏、蕲州
for k in ("zhou", "qizhou"):
    s = seg[k]; add(bandnoise(n, 200, 1800) * win(s["start"], s["end"], 1.2) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.35 * tt) ** 2), 0.035, 0.4)
# 竹林沙沙
s = seg["tang"]; add(bandnoise(n, 2500, 9000) * win(s["start"], s["end"], 1.2) * slow(0.21) ** 2, 0.03, 0.6)
# 艾火：噼啪声 + 低嘶
for k in ("open", "moxa"):
    s = seg[k]
    w = win(s["start"] + 0.5, s["end"], 1.0)
    clicks = np.zeros(n, np.float32)
    for c in rng.uniform(s["start"] + 0.5, s["end"], int(s["dur"] * 6)):
        i = int(c * SR); L = int(SR * 0.004)
        clicks[i:i + L] += rng.standard_normal(L).astype(np.float32) * np.exp(-np.arange(L) / (L / 4)) * rng.uniform(0.3, 1)
    add(clicks * w, 0.12); add(bandnoise(n, 3000, 12000) * w, 0.006)
# 昆虫：艾田里的虫鸣
s = seg["field"]
chirp = np.sin(2 * np.pi * 4800 * tt) * (np.sin(2 * np.pi * 38 * tt) > 0.6) * (np.sin(2 * np.pi * 0.7 * tt) > 0)
add(chirp.astype(np.float32) * win(s["start"], s["end"], 1.0), 0.006, 0.7)
# 拉坯：轮盘低鸣 + 湿泥摩擦
s = seg["pottery"]; w = win(s["start"], s["end"], 0.8)
add((np.sin(2 * np.pi * 58 * tt) * 0.5 + np.sin(2 * np.pi * 116 * tt) * 0.2).astype(np.float32) * w, 0.03)
add(bandnoise(n, 300, 2500) * w * (0.5 + 0.5 * np.sin(2 * np.pi * 1.5 * tt)), 0.02)
# 翻书、盖章
s = seg["book"]
i0 = int((s["start"] + 0.2) * SR); L = int(SR * 0.5)
add(np.pad(bandnoise(L, 1500, 7000) * np.hanning(L) ** 2, (i0, n - i0 - L)), 0.10)
if "stampT" in s:
    i0 = int((s["start"] + s["stampT"]) * SR); L = int(SR * 0.3)
    thump = (np.sin(2 * np.pi * 70 * np.arange(L) / SR) * np.exp(-np.arange(L) / (SR * 0.06))).astype(np.float32)
    add(np.pad(thump, (i0, n - i0 - L)), 0.25)
# 地图镜头切入时的低频呼啸
for s in TL["segments"]:
    if s["mode"] == "map" and not s.get("joinPrev"):
        i0 = int(max(0, s["start"] - 1.0) * SR); L = int(SR * 2.4)
        env = np.sin(np.linspace(0, np.pi, L)) ** 2
        add(np.pad(bandnoise(L, 40, 600) * env, (i0, max(0, n - i0 - L)))[:n], 0.09)
# 高铁驶过
s = seg["now"]; i0 = int((s["start"] + 0.02 * s["dur"]) * SR); L = int(SR * 3.5)
u = np.linspace(0, 1, L); env = np.exp(-((u - 0.45) / 0.18) ** 2)
whoosh = bandnoise(L, 300, 4000) * env
add(np.pad(whoosh * (1 - u), (i0, n - i0 - L)), 0.10, 0.25); add(np.pad(whoosh * u, (i0, n - i0 - L)), 0.10, 0.75)
sf.write(f"{OUT}/sfx.wav", sfx, SR)
print("sfx peak", float(np.abs(sfx).max()))
