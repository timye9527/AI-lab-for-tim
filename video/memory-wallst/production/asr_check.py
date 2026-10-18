#!/usr/bin/env python3
"""配音回检：用中文语音识别把每句配音听写回来，和稿子比对（按拼音，不看同音字）。

抓的是「基础错误」：数字被读成英文（ten 月 ten 号）、漏字、多字、读串行。
专有名词被听写成同音字（长鑫 → 长新）不算错。
"""
import re
from pypinyin import lazy_pinyin

_rec = None

def recognizer(model_dir):
    global _rec
    if _rec is None:
        import sherpa_onnx
        d = model_dir.rstrip('/') + '/'
        _rec = sherpa_onnx.OfflineRecognizer.from_paraformer(paraformer=d + 'model.int8.onnx', tokens=d + 'tokens.txt', num_threads=4)
    return _rec

def transcribe(model_dir, samples, sr):
    r = recognizer(model_dir); s = r.create_stream(); s.accept_waveform(sr, samples); r.decode_stream(s)
    return s.result.text

def syllables(text):
    han = re.sub(r'[^一-鿿]', '', text)
    return lazy_pinyin(han)

def edit(a, b):
    d = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        p, d[0] = d[0], i
        for j, y in enumerate(b, 1):
            p, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, p + (x != y))
    return d[-1]

def check(expected_tts_text, heard):
    """返回 (错误率, 问题说明)。expected 是送进合成的文本（已转中文数字）。"""
    exp, got = syllables(expected_tts_text), syllables(heard)
    rate = edit(exp, got) / max(1, len(exp))
    eng_exp = set(w.lower() for w in re.findall(r'[A-Za-z]{2,}', expected_tts_text))
    eng_got = [w for w in re.findall(r'[A-Za-z]{3,}', heard) if w.lower() not in eng_exp]
    issues = []
    if eng_got:
        issues.append('冒出英文：' + ' '.join(eng_got))
    if rate > 0.15:
        issues.append(f'拼音错误率 {rate:.0%}')
    return rate, '；'.join(issues)
