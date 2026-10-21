#!/usr/bin/env python3
"""《九月九日，与母后Battle》练习伴奏生成器。

只合成吉他和弦 + 节拍器，不含人声和旋律。歌词与段落全部来自同目录 song.txt。
用法：python3 music/battle-song/make_practice_track.py
输出（music/battle-song/out/）：practice_track.wav、practice_track_click.wav、cue_sheet.txt、琴谱.html
"""
from pathlib import Path
import sys
import wave

import numpy as np

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import songsheet  # noqa: E402

# 歌词、和弦、速度（BPM）、夹品都在 song.txt 里改
SONG_FILE = Path(__file__).resolve().parent / "song.txt"
SR = 44100           # 采样率
SEED = 9             # 随机种子，固定后每次生成结果一样

OUT_DIR = Path(__file__).resolve().parent / "out"

# 开放和弦音位（标准调弦，MIDI 音高，从低音弦到高音弦）
CHORDS = {
    "G":  [43, 47, 50, 55, 59, 67],  # 320003
    "C":  [48, 52, 55, 60, 64],      # x32010
    "D":  [50, 57, 62, 66],          # xx0232
    "Am": [45, 52, 57, 60, 64],      # x02210
    "Em": [40, 47, 52, 55, 59, 64],  # 022000
    "E":  [40, 47, 52, 56, 59, 64],  # 022100
    "A":  [45, 52, 57, 61, 64],      # x02220
    "Dm": [50, 57, 62, 65],          # xx0231
    "F":  [41, 48, 53, 57, 60, 65],  # 133211
}

SONG = songsheet.parse(SONG_FILE.read_text(encoding="utf-8"))
ROWS = [x for x in SONG["items"] if x["type"] == "line"]
BPM = float(SONG["meta"]["速度"])
CAPO = int(SONG["meta"]["夹品"])     # 和弦按 C 调指法写，整体升 CAPO 个半音
BEATS_PER_BAR = int(SONG["meta"]["拍号"].split("/")[0])

STYLE_GAIN = {"扫": 1.0, "重扫": 1.3, "轻扫": 0.6}
STRUM_PATTERN = [(0, "下"), (2, "下"), (3, "上"), (5, "上"), (6, "下"), (7, "上")]  # 八分音符位置
UP_GAIN = 0.7        # 上扫略轻
MUTE_SEC = 0.08      # 闷音音长
TAIL_SEC = 1.5       # 结尾余音
FADE = int(0.015 * SR)

BEAT = 60 / BPM
BAR = BEAT * BEATS_PER_BAR
N_BARS = sum(len(row["chords"]) for row in ROWS)
SONG_END = (1 + N_BARS) * BAR  # 含 1 小节预备拍
PLUCK_SEC = 2 * BAR + TAIL_SEC + 0.5  # 单个音最长要响多久

rng = np.random.default_rng(SEED)
_plucks = {}


def pluck(midi, variant):
    """Karplus-Strong 拨弦，先按整数延迟合成，再重采样到准确音高。"""
    key = (midi, variant)
    if key in _plucks:
        return _plucks[key]
    f = 440 * 2 ** ((midi + CAPO - 69) / 12)
    n = int(SR / f - 0.5)  # 平均滤波多出半个采样的延迟
    f0 = SR / (n + 0.5)
    out_len = int(PLUCK_SEC * SR)
    blocks = int(out_len * f / f0) // n + 3
    y = np.zeros(blocks * n)
    burst = np.convolve(np.random.default_rng((SEED, midi, variant)).uniform(-1, 1, n), [0.5, 0.5], "same")
    y[:n] = burst - burst.mean()
    t60 = 12.0 - (midi - 40) * 0.18  # 衰减 60dB 的秒数，低音弦响得久一些
    g = 10 ** (-3 / (t60 * f0))
    # y[i] = g * (y[i-n] + y[i-n-1]) / 2，按整段向量化
    for k in range(1, blocks):
        prev = np.concatenate(([0.0], y[:n])) if k == 1 else y[(k - 1) * n - 1:k * n]
        y[k * n:(k + 1) * n] = g * 0.5 * (prev[1:] + prev[:-1])
    s = np.interp(np.arange(out_len) * (f / f0), np.arange(len(y)), y)
    s /= np.abs(s).max()
    _plucks[key] = s
    return s


def add_note(buf, midi, t, end, gain, tau=None):
    s = pluck(midi, int(rng.integers(3)))
    i0 = int(t * SR)
    n = min(int((end - t) * SR) + FADE, len(s), len(buf) - i0)
    seg = s[:n] * gain
    if tau:  # 闷音、切音：快速衰减
        seg *= np.exp(-np.arange(n) / (tau * SR))
    seg[-FADE:] *= np.linspace(1, 0, min(FADE, n))
    buf[i0:i0 + n] += seg


def add_chop(buf, t, gain):
    """切音的“啪”：短噪声 + 一下极短的闷弦。"""
    n = int(0.05 * SR)
    noise = np.diff(rng.normal(0, 1, n + 1)) * np.exp(-np.arange(n) / (0.012 * SR))
    i0 = int(t * SR)
    buf[i0:i0 + n] += noise[:len(buf) - i0] * 0.12 * gain


def click(accent):
    t = np.arange(int(0.03 * SR)) / SR
    return np.sin(2 * np.pi * (2000 if accent else 1300) * t) * np.exp(-t / 0.006) * (0.5 if accent else 0.3)


def build_events():
    """返回 (事件列表, 制动时间点, 歌词时间表)。事件 end 为 None 表示响到下一个声音或制动点。"""
    events, damps, cues = [], [], []
    bar_no = 0
    for row in ROWS:
        chords, style, vol, ramp = row["chords"], row["style"], row["vol"], row["ramp"]
        row_start = (1 + bar_no) * BAR
        row_len = len(chords) * BAR
        cues.append((row_start, bar_no + 1, row["section"], " ".join(chords), style, row["lyric"]))

        def gain_at(t):
            if ramp:
                a, b = ramp
                return vol * (a + (b - a) * (t - row_start) / row_len)
            return vol

        for j, name in enumerate(chords):
            t0 = row_start + j * BAR
            if style == "停" or name == "-":
                damps.append(t0)
                continue
            if name not in CHORDS:
                raise ValueError(f"song.txt 第 {row['line_no']} 行：还没有 {name} 和弦的音位，请加到 CHORDS")
            notes = CHORDS[name]
            rest = row["rest"] if j == len(chords) - 1 else 0
            stop = t0 + (BEATS_PER_BAR - rest) * BEAT
            if rest:
                damps.append(stop)
            if style in STYLE_GAIN:
                for pos, d in STRUM_PATTERN:
                    t = t0 + pos * BEAT / 2
                    if t < stop:
                        g = gain_at(t) * STYLE_GAIN[style] * (UP_GAIN if d == "上" else 1)
                        events.append(dict(t=t, kind="strum", notes=notes, dir=d, gain=g, end=None))
            elif style == "闷":
                for k in range(BEATS_PER_BAR * 2):
                    t = t0 + k * BEAT / 2
                    events.append(dict(t=t, kind="strum", notes=notes, dir="下", gain=0.55 * vol,
                                       end=t + MUTE_SEC, tau=0.03))
            elif style == "切":
                for b in range(BEATS_PER_BAR):
                    t = t0 + b * BEAT
                    if b % 2 == 0:
                        events.append(dict(t=t, kind="strum", notes=notes, dir="下", gain=gain_at(t), end=None))
                    else:
                        events.append(dict(t=t, kind="chop", notes=notes, gain=gain_at(t)))
            elif style == "响":
                if j == 0:  # 整行只扫一下，余音响到本行结束
                    events.append(dict(t=t0, kind="strum", notes=notes, dir="下", gain=vol, end=None))
            elif style == "分解":
                for b in range(BEATS_PER_BAR):
                    events.append(dict(t=t0 + b * BEAT, kind="note", notes=[notes[b % len(notes)]],
                                       gain=0.8 * vol, end=t0 + BAR))
            else:
                raise ValueError(f"未知弹法：{style}")
        bar_no += len(chords)
    return events, damps, cues


def render(events, damps):
    buf = np.zeros(int((SONG_END + TAIL_SEC + 0.5) * SR))
    cuts = sorted({e["t"] for e in events if e["kind"] != "note"} | set(damps))
    for e in events:
        if e["kind"] == "chop":
            add_chop(buf, e["t"], e["gain"])
            for k, m in enumerate(e["notes"]):
                add_note(buf, m, e["t"] + k * 0.004, e["t"] + 0.03, 0.15 * e["gain"], tau=0.01)
            continue
        end = e["end"]
        if end is None:  # 响到下一下扫弦或停顿，最后一下带余音
            end = next((c for c in cuts if c > e["t"] + 1e-6), SONG_END + TAIL_SEC)
        notes = e["notes"]
        if e.get("dir") == "上":
            notes = notes[::-1][:4]  # 上扫只扫高音几根弦
        spread = 0.008 if e.get("dir") == "上" else 0.010
        for k, m in enumerate(notes):
            t = e["t"] + k * spread
            add_note(buf, m, t, max(end, t + 0.02), e["gain"] / len(notes) ** 0.5, tau=e.get("tau"))
    return buf / np.abs(buf).max() * 0.8


def add_clicks(buf, bars):
    for b in range(bars):
        for beat in range(BEATS_PER_BAR):
            c = click(beat == 0)
            i0 = int((b * BAR + beat * BEAT) * SR)
            buf[i0:i0 + len(c)] += c
    return buf


def write_wav(path, x):
    peak = np.abs(x).max()
    if peak > 0.99:
        x = x / peak * 0.99
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def fmt(t):
    t = round(t, 1)
    return f"{int(t // 60)}:{t % 60:04.1f}"


def write_cues(path, cues):
    lines = [
        f"《{SONG['meta']['标题']}》练习伴奏 · 歌词时间表",
        f"BPM {BPM:g} · {BEATS_PER_BAR}/4 · 夹 {CAPO} 品（C 调指法）· 每小节 {BAR:.2f} 秒 · 共 {N_BARS} 小节",
        f"0:00.0 起是 1 小节预备拍（4 下滴答），第 1 小节从 {fmt(BAR)} 开始，全长约 {fmt(SONG_END + TAIL_SEC)}",
        "",
        "时间     小节  段落      和弦（本句每小节）  弹法  歌词",
    ]
    prev = None
    for t, bar, section, chord, style, text in cues:
        if section != prev:
            lines.append(f"\n【{section}】")
            prev = section
        lines.append(f"{fmt(t):<8} {bar:>3}   {section:<6}{chord:<12}{style:<4}{text}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    OUT_DIR.mkdir(exist_ok=True)
    events, damps, cues = build_events()
    guitar = render(events, damps)
    write_wav(OUT_DIR / "practice_track.wav", add_clicks(guitar.copy(), 1))
    write_wav(OUT_DIR / "practice_track_click.wav", add_clicks(guitar.copy(), 1 + N_BARS))
    write_cues(OUT_DIR / "cue_sheet.txt", cues)
    (OUT_DIR / "琴谱.html").write_text(songsheet.build_html(SONG_FILE.read_text(encoding="utf-8")), encoding="utf-8")
    print(f"BPM {BPM:g}，夹 {CAPO} 品，{N_BARS} 小节，全长 {fmt(len(guitar) / SR)}，输出到 {OUT_DIR}")


if __name__ == "__main__":
    main()
