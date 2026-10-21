# 本地中文配音：Kokoro-82M（ONNX，Apache-2.0）+ misaki 中文注音
# 模型和音色都来自 npm（kokoro-q8-shards / kokoro-js），不联网调用任何 TTS 服务
# 用法：python tts.py <模型目录> <voiceover.json> <输出目录>
import sys, os, json, re
import numpy as np, soundfile as sf, onnxruntime as ort
import kokoro_onnx
from misaki import zh

MODEL_DIR, VO, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True)
vocab = json.load(open(os.path.join(os.path.dirname(kokoro_onnx.__file__), "config.json")))["vocab"]
sess = ort.InferenceSession(os.path.join(MODEL_DIR, "kokoro-q8.onnx"), providers=["CPUExecutionProvider"])
g2p = zh.ZHG2P()
SR = 24000
# 中文标点换成模型认识的半角标点；书名号、引号去掉
PUNCT = str.maketrans({"，": ",", "。": ".", "；": ";", "：": ":", "！": "!", "？": "?", "、": ",", "《": None, "》": None, "「": None, "」": None, "·": None, "“": None, "”": None})

def voice(name):
    return np.fromfile(os.path.join(MODEL_DIR, "voices", f"{name}.bin"), dtype="<f4").reshape(-1, 1, 256)

def trim(a, thr=0.012, keep=0.06):
    """裁掉首尾静音，保留一点余量"""
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx):
        return a
    k = int(SR * keep)
    return a[max(0, idx[0] - k): idx[-1] + k]

def say(text, v, speed=1.0):
    ph = g2p(text)
    ph = ph[0] if isinstance(ph, tuple) else ph
    ph = ph.translate(PUNCT)
    ids = [vocab[c] for c in ph if c in vocab][:510]
    style = v[len(ids)]
    audio = sess.run(None, {"input_ids": np.array([[0, *ids, 0]], dtype=np.int64), "style": style.astype(np.float32), "speed": np.array([speed], dtype=np.float32)})[0]
    return np.asarray(audio).reshape(-1), ph

if __name__ == "__main__":
    spec = json.load(open(VO))
    v = voice(spec.get("voice", "zm_yunjian"))
    meta = []
    for i, line in enumerate(spec["lines"]):
        # 按句号切句；句内逗号交给模型自己停顿。每句裁掉首尾静音，句间留固定停顿
        parts = [p for p in re.split(r"(?<=[。！？；])", line["text"]) if p.strip()]
        chunks = []
        for p in parts:
            a, ph = say(p, v, line.get("speed", spec.get("speed", 0.92)))
            chunks += [trim(a), np.zeros(int(SR * 0.55), np.float32)]
        a = np.concatenate(chunks[:-1])
        f = f"{OUT}/{line.get('id', f'vo_{i:02d}')}.wav"
        sf.write(f, a, SR)
        meta.append({"id": line.get("id", i), "file": os.path.basename(f), "dur": round(len(a) / SR, 2), "text": line["text"]})
        print(i, meta[-1]["dur"], line["text"][:30], flush=True)
    json.dump(meta, open(f"{OUT}/vo.json", "w"), ensure_ascii=False, indent=1)
