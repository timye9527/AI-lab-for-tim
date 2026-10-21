# 混音：人声处理（均衡、压缩、小房间混响）+ 配乐大厅混响 + 人声出现时压低音乐 + 响度标准化
# 用法：python mix.py <timeline.json> <音频目录> <输出.wav>
import sys, json, os, subprocess
import numpy as np, soundfile as sf
from scipy import signal

TL = json.load(open(sys.argv[1]))
AD, OUT = sys.argv[2], sys.argv[3]
SR = 48000
rng = np.random.default_rng(5)

def biquad(kind, f0, q=0.707, gain_db=0.0):
    """RBJ 均衡器系数"""
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f0 / SR; al = np.sin(w) / (2 * q); c = np.cos(w)
    if kind == "hp":
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]; a = [1 + al, -2 * c, 1 - al]
    elif kind == "peak":
        b = [1 + al * A, -2 * c, 1 - al * A]; a = [1 + al / A, -2 * c, 1 - al / A]
    elif kind == "lowshelf":
        sq = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) - (A - 1) * c + sq), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sq)]
        a = [(A + 1) + (A - 1) * c + sq, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sq]
    elif kind == "highshelf":
        sq = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) + (A - 1) * c + sq), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sq)]
        a = [(A + 1) - (A - 1) * c + sq, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sq]
    return np.array(b) / a[0], np.array(a) / a[0]

def eq(x, *bands):
    for bd in bands:
        b, a = biquad(*bd); x = signal.lfilter(b, a, x, axis=0)
    return x

def envelope(x, attack, release):
    """包络跟随（秒）"""
    x = np.abs(x); out = np.zeros_like(x); ga, gr = np.exp(-1 / (attack * SR)), np.exp(-1 / (release * SR)); e = 0.0
    # 降采样做，速度快
    step = 48; xs = x[::step]; es = np.zeros_like(xs)
    ga, gr = np.exp(-step / (attack * SR)), np.exp(-step / (release * SR))
    for i, v in enumerate(xs):
        e = ga * e + (1 - ga) * v if v > e else gr * e + (1 - gr) * v
        es[i] = e
    return np.interp(np.arange(len(x)), np.arange(len(xs)) * step, es)

def compress(x, thr_db=-20, ratio=3.0, makeup_db=4):
    env = envelope(x, 0.005, 0.12) + 1e-9
    lvl = 20 * np.log10(env)
    over = np.maximum(0, lvl - thr_db)
    g = 10 ** ((-over * (1 - 1 / ratio) + makeup_db) / 20)
    return x * g

def ir(decay, length, predelay=0.02, damp=6000):
    """合成立体声混响脉冲：指数衰减的噪声，高频衰减得更快"""
    n = int(length * SR); t = np.arange(n) / SR
    out = []
    for ch in range(2):
        nz = rng.standard_normal(n) * np.exp(-6.9 * t / decay)
        b, a = signal.butter(1, damp / (SR / 2)); nz = signal.lfilter(b, a, nz)
        nz[: int(predelay * SR)] = 0
        out.append(nz / np.sqrt((nz ** 2).sum()))
    return np.stack(out, 1)

def reverb(x, h, wet):
    y = np.stack([signal.fftconvolve(x[:, c], h[:, c])[: len(x)] for c in range(2)], 1)
    return x * (1 - wet) + y * wet * 2.2

N = int(SR * (TL["duration"] + 1.0))

# ---------- 人声 ----------
vo_meta = {m["id"]: m for m in json.load(open(f"{AD}/vo/vo.json"))}
voice = np.zeros(N)
for s in TL["segments"]:
    for it in s["items"]:
        a, sr = sf.read(f"{AD}/vo/{vo_meta[it['id']]['file']}")
        a = signal.resample_poly(a, SR, sr)
        i0 = int(it["start"] * SR); voice[i0:i0 + len(a)] += a[: N - i0]
voice = eq(voice, ("hp", 80, 0.7), ("lowshelf", 160, 0.7, 2.5), ("peak", 420, 1.0, -2.5), ("peak", 3200, 0.9, 3.0), ("highshelf", 9000, 0.7, 1.5))
voice = compress(voice, -22, 3.0, 5)
voice = voice / (np.sqrt(np.mean(voice[voice != 0] ** 2)) + 1e-9) * 0.09
v2 = np.stack([voice, voice], 1)
v2 = reverb(v2, ir(0.45, 0.6, 0.01, 7000), 0.10)

# ---------- 配乐 ----------
music, _ = sf.read(f"{AD}/music_dry.wav")
music = music[:N] if len(music) >= N else np.pad(music, ((0, N - len(music)), (0, 0)))
music = eq(music, ("hp", 35, 0.7), ("peak", 250, 0.8, -1.5), ("highshelf", 8000, 0.7, 1.0))
music = reverb(music, ir(2.8, 3.5, 0.03, 5000), 0.32)
music = music / (np.sqrt(np.mean(music ** 2)) + 1e-9) * 0.07

# 人声出现时把音乐压低约 7 dB
venv = envelope(voice, 0.08, 0.6)
duck = 1 - 0.66 * np.clip(venv / (np.percentile(venv[venv > 1e-4], 70) + 1e-9), 0, 1)
music *= duck[:, None]

sfx, _ = sf.read(f"{AD}/sfx.wav")
sfx = sfx[:N] if len(sfx) >= N else np.pad(sfx, ((0, N - len(sfx)), (0, 0)))
sfx = reverb(sfx, ir(1.2, 1.5, 0.02, 6000), 0.2)

mix = v2 + music + sfx * 2.4
on = venv > 0.01
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print(f"人声段：人声 {db(v2[on]):.1f} dB，音乐 {db(music[on]):.1f} dB，音效 {db(sfx[on]):.1f} dB；无人声段音乐 {db(music[~on]):.1f} dB")
fade = np.clip(np.arange(N) / (SR * 0.5), 0, 1) * np.clip((N - np.arange(N)) / (SR * 3.0), 0, 1)
mix *= fade[:, None]
pre = OUT.replace(".wav", "_pre.wav")
sf.write(pre, (mix / (np.abs(mix).max() + 1e-9) * 0.7).astype(np.float32), SR)

# 响度标准化：-16 LUFS，真峰值 -1.5 dBTP（两遍 loudnorm）
probe = subprocess.run(["ffmpeg", "-hide_banner", "-i", pre, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
js = json.loads(probe[probe.rindex("{"): probe.rindex("}") + 1])
af = (f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}"
      f":measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true,aresample=48000")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", pre, "-af", af, "-ar", "48000", OUT], check=True)
print("mix", OUT, "input LUFS", js["input_i"])
