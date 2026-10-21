# 本地中文配音（v3）：MeloTTS（MIT，sherpa-onnx 转换版，模型来自 npm 包 @3sln/donki-lle-voice-zh）
# 比 Kokoro v1.0 的中文韵律自然。先按词典做最长匹配打印拼音，方便人工核对多音字。
# 用法：python tts_melo.py <模型目录> <voiceover.json> <输出目录> [--check]
import sys, os, json, re
import numpy as np, soundfile as sf

MODEL, VO, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
CHECK = "--check" in sys.argv

lex = {}
for line in open(os.path.join(MODEL, "lexicon.txt"), encoding="utf-8"):
    p = line.split()
    if p and p[0] not in lex:
        lex[p[0]] = p[1:]
MAXW = 8

def pinyin(text):
    """模拟词典最长匹配，给出每个词的读音"""
    out, i = [], 0
    s = re.sub(r"[^一-鿿]", " ", text)
    while i < len(s):
        if s[i] == " ":
            i += 1; continue
        for L in range(min(MAXW, len(s) - i), 0, -1):
            w = s[i:i + L]
            if w in lex:
                ph = lex[w]; n = len(ph) // 2
                syl = ["".join(ph[2 * k:2 * k + 2]) + "" for k in range(n)]
                tones = ph[len(ph) // 2:] if len(ph) % 2 == 0 else []
                out.append(f"{w}[{' '.join(ph)}]" if L > 1 else f"{w}{ph[1] if len(ph) > 1 else ''}{ph[-1]}")
                i += L; break
        else:
            out.append(f"{s[i]}?"); i += 1
    return " ".join(out)

spec = json.load(open(VO))
# 按词指定声调：取每个字的默认音素，换成指定声调，写进一份新词典
over = {}
for w, tones in spec.get("lexicon", {}).items():
    phs, tns = [], []
    for ch, tone in zip(w, tones):
        e = lex[ch]; k = len(e) // 2
        phs += e[:k]; tns += [str(tone)] * k
    over[w] = phs + tns
lex.update(over)
os.makedirs(OUT, exist_ok=True)
LEX = os.path.join(OUT, "lexicon.txt")
with open(os.path.join(MODEL, "lexicon.txt"), encoding="utf-8") as fi, open(LEX, "w", encoding="utf-8") as fo:
    for w, e in over.items():
        fo.write(f"{w} {' '.join(e)}\n")
    for line in fi:
        if line.split(" ", 1)[0] not in over:
            fo.write(line)
if CHECK:
    for l in spec["lines"]:
        print(l["id"], "|", pinyin(l.get("say", l["text"])))
    sys.exit()

import sherpa_onnx
cfg = sherpa_onnx.OfflineTtsConfig(
    model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(
        model=os.path.join(MODEL, "model.onnx"), lexicon=LEX, tokens=os.path.join(MODEL, "tokens.txt"),
        noise_scale=0.6, noise_scale_w=0.7, length_scale=1.0), num_threads=4),
    rule_fsts=",".join(os.path.join(MODEL, f) for f in ("phone.fst", "date.fst", "number.fst")),
    max_num_sentences=1)
tts = sherpa_onnx.OfflineTts(cfg)

def trim(a, sr, thr=0.01, keep=0.05):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx):
        return a
    k = int(sr * keep)
    return a[max(0, idx[0] - k): idx[-1] + k]

meta = []
speed = spec.get("speed", 0.9)
for l in spec["lines"]:
    text = l.get("say", l["text"])
    # 模型不认识的标点：冒号当逗号停顿，书名号去掉
    text = text.replace("：", "，").replace("《", "").replace("》", "").replace("·", "")
    parts = [p for p in re.split(r"(?<=[。！？；])", text) if p.strip()]
    chunks, sr = [], 44100
    for p in parts:
        g = tts.generate(p, sid=0, speed=l.get("speed", speed))
        sr = g.sample_rate
        chunks += [trim(np.asarray(g.samples, np.float32), sr), np.zeros(int(sr * 0.45), np.float32)]
    a = np.concatenate(chunks[:-1])
    f = f"{l['id']}.wav"
    sf.write(os.path.join(OUT, f), a, sr)
    meta.append({"id": l["id"], "file": f, "dur": round(len(a) / sr, 2), "text": text})
    print(l["id"], meta[-1]["dur"], text[:30], flush=True)
json.dump(meta, open(os.path.join(OUT, "vo.json"), "w"), ensure_ascii=False, indent=1)
