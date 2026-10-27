"""节奏对比：同一个意思换几种说法，看配音里每个字占多长，找出被拖长或挤短的字。

用法：npm run video:rhythm -- "恒生科技最高到过六千点" "恒生科技指数最高到过六千点"
每个字后面的数字 = 下一个字的起点 − 这个字的起点（秒），由 SenseVoice 的时间戳算出，误差约 0.06 秒。
同一段文字这个模型每次合成都一样，重读改不了节奏，只能换说法。
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pron  # noqa: E402
import tts  # noqa: E402

LONG = 0.28  # 句中一个字占到这么长（逗号前除外），听起来就像停了一下


def main():
    texts = [t for t in sys.argv[1:] if t.strip()]
    if not texts:
        raise SystemExit(__doc__)
    cache = os.path.join(tts.ROOT, '..', '.cache', 'rhythm')
    os.makedirs(cache, exist_ok=True)
    entries = {}
    for t in texts:
        entries.update(pron.analyze(t)[1])
    lex = os.path.join(cache, 'lexicon.txt')
    with open(lex, 'w', encoding='utf-8') as f:
        for w, py in entries.items():
            f.write(f'{w} {" ".join(py)}\n')
        for line in open(tts.D + 'lexicon.txt', encoding='utf-8'):
            if line.split(' ', 1)[0] not in entries:
                f.write(line)
    engine = tts.load_tts(lex)
    asr = dict(tts.load_asr())['SenseVoice']
    for t in texts:
        a = engine.generate(pron.analyze(t)[0], sid=0, speed=1.0)
        s = asr.create_stream()
        s.accept_waveform(a.sample_rate, np.array(a.samples, dtype=np.float32))
        asr.decode_stream(s)
        toks, ts = s.result.tokens, s.result.timestamps
        cells = []
        for i in range(len(toks) - 1):
            d = ts[i + 1] - ts[i]
            flag = '↑拖长' if d >= LONG else ''
            cells.append(f'{toks[i]}{d:.2f}{flag}')
        print(f'{t}\n  {" ".join(cells)} {toks[-1] if toks else ""}\n')


if __name__ == '__main__':
    main()
