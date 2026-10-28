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
    joined = re.sub(r'(?<=\b[A-Za-z]) (?=[A-Za-z]\b)', '', expected_tts_text)  # 「C E O」合回「CEO」
    eng_exp = set(w.lower() for w in re.findall(r'[A-Za-z]{2,}', joined + ' ' + expected_tts_text.replace(' ', '')))
    eng_got = [w for w in re.findall(r'[A-Za-z]{3,}', heard) if w.lower() not in eng_exp]
    issues = []
    if eng_got:
        issues.append('冒出英文：' + ' '.join(eng_got))
    # 稿子里的英文缩写必须听得到：婚庆片 Matcha 把「A I」整个跳过，只比汉字的检查报了通过
    heard_letters = re.sub(r'[^a-z]', '', heard.lower())
    for w in re.findall(r'[A-Za-z]+', joined.replace(' ', '') if re.fullmatch(r'[A-Za-z ]+', joined) else joined):
        if w.lower() not in heard_letters:
            issues.append(f'英文没听到：{w}' + ('（听成了汉字，可能读成「爱」，人耳确认）' if re.search('[爱艾哀诶欸]', heard) else ''))
    if rate > 0.15:
        issues.append(f'拼音错误率 {rate:.0%}')
    return rate, '；'.join(issues)
