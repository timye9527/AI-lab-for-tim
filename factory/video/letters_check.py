"""验证 letters.txt 里每个字母和整词缩写的读法：放进句子里合成 3 次，SenseVoice 都听成对应字母才算过。

用法：python3 letters_check.py [字母或缩写 ...]   不带参数就验证全部
加了新缩写或改了字母读法后跑一次，不过的要换写法或标 ✗。
"""
import re, sys, tempfile, os
import numpy as np
import pron
from tts import load_tts, load_asr, D

CARRIER = '这里的{}怎么读。'


def main():
    want = sys.argv[1:] or [k for k, v in pron.LETTER_PY.items() if v] + list(pron.LETTER_WORD) + list(pron.ACRONYMS)
    texts = {w: CARRIER.format(w) for w in want}
    entries = {}
    for w, t in texts.items():
        try:
            _, ent, _ = pron.analyze(t)
        except ValueError as e:
            print(f'{w}: ✗ {e}')
            continue
        entries.update(ent)
    lex = os.path.join(tempfile.mkdtemp(), 'lexicon.txt')
    with open(lex, 'w', encoding='utf-8') as f:
        for w, py in entries.items():
            f.write(f'{w} {" ".join(py)}\n')
        for line in open(D + 'lexicon.txt', encoding='utf-8'):
            if line.split(' ', 1)[0] not in entries:
                f.write(line)
    tts = load_tts(lex)
    sv = load_asr()[0][1]
    import librosa
    bad = 0
    for w, t in texts.items():
        norm = pron.normalize(t)
        hits, heard = 0, []
        for _ in range(3):
            a = tts.generate(norm, sid=0, speed=1.0)
            x = np.array(a.samples, dtype=np.float32)
            s = sv.create_stream()
            s.accept_waveform(16000, librosa.resample(x, orig_sr=a.sample_rate, target_sr=16000))
            sv.decode_stream(s)
            h = s.result.text
            heard.append(h)
            got = re.sub(r'[^a-z]', '', re.sub(r'^这里的|怎么读$', '', h.replace(' ', '')).lower())
            hits += got == w.lower()
        ok = hits == 3
        bad += not ok
        print(f'{w}: {"✓" if ok else "✗"} {hits}/3  听到：{" | ".join(heard)}')
    print(f'{len(texts) - bad} 个通过，{bad} 个不过')


if __name__ == '__main__':
    main()
