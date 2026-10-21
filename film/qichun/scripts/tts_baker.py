# 本地中文配音（标准普通话女声）：标贝（Baker）语料训练的 FastSpeech2 / Tacotron2 + MB-MelGAN
# 模型来自 PyPI 包 zhtts（MIT）。需要 Python 3.11 + tensorflow 2.15（见 README）。
# 在 zhtts 自带的拼音前端上补了变调：「一」「不」变调、词内三声连读，以及 voiceover.json 里按词指定的声调。
# 用法：python tts_baker.py <zhtts 包目录> <voiceover.json> <输出目录> [FASTSPEECH2|TACOTRON] [--ids id1,id2]
import sys, os, re, json
import numpy as np, soundfile as sf

PKG, VO, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
ENGINE = sys.argv[4] if len(sys.argv) > 4 and not sys.argv[4].startswith("--") else "FASTSPEECH2"
ONLY = None
if "--ids" in sys.argv:
    ONLY = set(sys.argv[sys.argv.index("--ids") + 1].split(","))
sys.path.insert(0, PKG)
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
from zhtts import TTS
from zhtts.tensorflow_tts.processor.baker import NSWNormalizer, Style
import jieba

spec = json.load(open(VO))
OVER = {w: [int(x) for x in t] for w, t in spec.get("lexicon", {}).items()}
NUM = set("零一二三四五六七八九十")
HAN = re.compile(r"[一-鿿]")

def sandhi(text, py):
    """text：规范化后的文本；py：与其中汉字一一对应的 TONE3 拼音"""
    chars = [c for c in text if HAN.match(c)]
    assert len(chars) == len(py), (text, py)
    tone = [int(p[-1]) if p[-1].isdigit() else 5 for p in py]
    base = [p[:-1] if p[-1].isdigit() else p for p in py]
    lock = [False] * len(chars)
    # 汉字在原文里的位置，用来判断中间有没有标点
    pos = [i for i, c in enumerate(text) if HAN.match(c)]
    joined = "".join(chars)
    for w, ts in OVER.items():
        for m in re.finditer(re.escape(w), joined):
            # 只认原文里连续出现的（中间没有标点）
            if pos[m.end() - 1] - pos[m.start()] != len(w) - 1:
                continue
            for k, tt in enumerate(ts):
                tone[m.start() + k] = tt; lock[m.start() + k] = True
    n = len(chars)
    adj = lambda i: i + 1 < n and pos[i + 1] == pos[i] + 1
    for i, c in enumerate(chars):
        if lock[i] or not adj(i):
            continue
        if c == "一":
            prev = chars[i - 1] if i > 0 and pos[i - 1] == pos[i] - 1 else ""
            nxt = chars[i + 1]
            if prev in NUM or (nxt in NUM and nxt not in "千百万"):
                continue                      # 读数字时不变调：一五一八、二零一一
            tone[i] = 2 if tone[i + 1] == 4 else 4
        elif c == "不" and tone[i + 1] == 4:
            tone[i] = 2
    # 词内三声连读：从右往左，前一个三声变二声
    words, k = [], 0
    for w in jieba.cut(joined):
        words.append((k, k + len(w))); k += len(w)
    orig = tone[:]
    for a, b in words:
        for i in range(b - 2, a - 1, -1):
            if not lock[i] and orig[i] == 3 and orig[i + 1] == 3 and adj(i):
                tone[i] = 2
    return [f"{b_}{t}" for b_, t in zip(base, tone)]

tts = TTS(text2mel_name=ENGINE)
proc = tts.processor
_orig = proc.text_to_phone
def text_to_phone(text):
    text = NSWNormalizer(text.strip()).normalize()
    py = ["".join(x) for x in proc.pinyin_parser(text, style=Style.TONE3, errors="ignore")]
    py = [x for x in py if "#" not in x]
    py = sandhi(text, py)
    return text, " ".join(proc.get_phoneme_from_char_and_pinyin(text, py))
proc.text_to_phone = text_to_phone

SR = 24000
speed = spec.get("speed_baker", 0.95)
if ENGINE == "FASTSPEECH2":
    _prep = tts.prepare_input
    def prepare_input(ids):
        a = list(_prep(ids)); a[2] = np.array([1.0 / speed], np.float32)   # 时长倍数 >1 读得更慢
        return tuple(a)
    tts.prepare_input = prepare_input

def trim(a, thr=0.01, keep=0.05):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx):
        return a
    k = int(SR * keep)
    return a[max(0, idx[0] - k): idx[-1] + k]

os.makedirs(OUT, exist_ok=True)
meta_path = os.path.join(OUT, "vo.json")
meta = {m["id"]: m for m in json.load(open(meta_path))} if os.path.exists(meta_path) else {}
for l in spec["lines"]:
    if ONLY and l["id"] not in ONLY:
        continue
    text = l.get("say", l["text"]).replace("《", "").replace("》", "").replace("·", "").replace("「", "").replace("」", "")
    chunks = []
    # 句内逗号处停短，句号处停长
    for sent in [s for s in re.split(r"(?<=[。！？；])", text) if s.strip()]:
        for j, ph in enumerate([p for p in re.split(r"(?<=[，、：])", sent) if p.strip()]):
            phon = proc.text_to_phone(ph)[1]
            mel = tts.text2mel(ph)
            a = trim(tts.mel2audio(mel)[: None if ENGINE == "FASTSPEECH2" else -2048])
            chunks += [a, np.zeros(int(SR * (0.18 if ph[-1] in "，、：" else 0.42)), np.float32)]
            print(l["id"], ph, "|", phon.replace(" #0", ""), flush=True)
    a = np.concatenate(chunks[:-1]).astype(np.float32)
    sf.write(os.path.join(OUT, f"{l['id']}.wav"), a, SR)
    meta[l["id"]] = {"id": l["id"], "file": f"{l['id']}.wav", "dur": round(len(a) / SR, 2), "text": text}
json.dump([meta[l["id"]] for l in spec["lines"] if l["id"] in meta], open(meta_path, "w"), ensure_ascii=False, indent=1)
print("done", len(meta))
