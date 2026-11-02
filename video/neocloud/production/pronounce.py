#!/usr/bin/env python3
"""多音字核对：过稿时跑一遍，列出全稿每个多音字在合成时会怎么读。

  python3 production/pronounce.py          → 生成 08-读音核对表.md；有「待确认」时退出码为 1
  python3 production/pronounce.py --lexicon out/tts/lexicon.txt   → 同时生成合成词典（行业读音表优先）

判定：
  ✅ 已确认   命中 production/pronounce.tsv（人工确认过的行业读音）
  ⚠️ 待确认   合成词典的读法 ≠ 拼音库按上下文的读法 → 必须人工拍板，再写进 pronounce.tsv
  ·  一致     两者一致，扫一眼即可
注意：拼音库本身也会在行业词上读错（如「长约」「剪刀差」），所以「一致」不等于一定对。
"""
import os, re, sys
from pypinyin import pinyin, lazy_pinyin, Style

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
BASE_LEX = os.environ.get('ZIPVOICE_LEX', '/tmp/claude-0/zv/sherpa-onnx-zipvoice-distill-int8-zh-en-emilia').rstrip('/') + '/lexicon.txt'
# 常见多音字：核对表只列这些字和「读音根本不同」的冲突，避免几百个罕见读音淹没重点
COMMON = set('长行重还调差得了着只为量便地数处少好角降将空乐率期藏传冲当倒都发分供给更间结觉看落难强散省似相兴应几仔奇种中朝参曾卡薄削模露折转背扎缝没哄劲累缩识系血压与曲尽号恶冲载')
INITIALS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w']

def tokens(py):
    # chang2 → ch0 ang2；er4 → （空声母）er4
    out = []
    for syl in py.split():
        ini = next((i for i in INITIALS if syl.startswith(i) and len(syl) > len(i)), '')
        out.append(f'{ini}0 {syl[len(ini):]}' if ini else f' {syl}')
    return ' '.join(out)

def load_curated():
    cur = {}
    for ln in open(os.path.join(HERE, 'pronounce.tsv'), encoding='utf8'):
        if ln.startswith('#') or not ln.strip():
            continue
        w, py, *note = ln.rstrip('\n').split('\t')
        cur[w] = (py, note[0] if note else '')
    return cur

def load_lex(path):
    lex = {}
    for ln in open(path, encoding='utf8'):
        w, _, rest = ln.rstrip('\n').partition(' ')
        if w and w not in lex:
            lex[w] = rest
    return lex

def lex_reading(lex, text, i):
    # 模拟合成前端：正向最长匹配，返回第 i 个字在匹配到的词里的读音
    j = 0
    while j < len(text):
        for L in range(min(6, len(text) - j), 0, -1):
            w = text[j:j + L]
            if w in lex:
                if j <= i < j + L:
                    toks = lex[w].split()
                    syl = [a + b for a, b in zip(toks[0::2], toks[1::2])] if len(toks) == 2 * L else None
                    if syl is None:  # 有零声母时按音节重切
                        syl = re.findall(r'(?:[a-z]+0 )?[a-z]+\d', lex[w])
                    s = syl[i - j] if i - j < len(syl) else '?'
                    return s.replace('0 ', '').replace('0', '').strip(), w
                j += L
                break
        else:
            j += 1
    return '?', text[i]

def same(ch, tts, guess, nxt):
    # 口语变调不算错：一 / 不 的变调、上声连读（3+3 → 2+3）、轻声
    if tts == guess:
        return True
    bt, bg = tts.rstrip('012345'), guess.rstrip('012345')
    if bt != bg:
        return False
    tt, tg = tts[-1:], guess[-1:]
    if ch in '一不':
        return True
    if tt == '2' and tg == '3' and nxt.endswith('3'):
        return True
    return '5' in (tt, tg)

def main():
    cur = load_curated()
    lex = load_lex(BASE_LEX)
    lines = [re.sub(r'\s*\[F\d+\]\s*', '', l[2:]).strip() for l in open(os.path.join(ROOT, '02-脚本-10分钟.md'), encoding='utf8') if l.startswith('> ')]
    lines = [l for l in lines if not l.startswith('版本') and '`' not in l][0:]
    body = open(os.path.join(ROOT, '02-脚本-10分钟.md'), encoding='utf8').read()
    body = body[body.index('\n## '):]
    lines = [re.sub(r'\s*\[F\d+\]\s*', '', l[2:]).strip() for l in body.split('\n') if l.startswith('> ')]
    merged = dict(lex); merged.update({w: tokens(py) for w, (py, _) in cur.items()})
    used, warn, ok = {}, [], []
    for ln in lines:
        for w in cur:
            if w in ln:
                used[w] = cur[w]
        ctx = lazy_pinyin(ln, style=Style.TONE3, neutral_tone_with_five=True, errors=lambda x: [''] * len(x))
        for i, ch in enumerate(ln):
            if not re.match(r'[一-鿿]', ch):
                continue
            readings = {r for r in pinyin(ch, style=Style.TONE3, heteronym=True, neutral_tone_with_five=True)[0]}
            if len(readings) < 2:
                continue
            if any(w in ln and ln.find(w) <= i < ln.find(w) + len(w) for w in cur):
                continue
            tts, word = lex_reading(merged, ln, i)
            guess = ctx[i] if i < len(ctx) else '?'
            ctxs = ln[max(0, i - 4):i + 5]
            nxt = ctx[i + 1] if i + 1 < len(ctx) else ''
            if ch not in COMMON and tts.rstrip('012345') == guess.rstrip('012345'):
                continue
            (warn if not same(ch, tts, guess, nxt) else ok).append((ch, ctxs, tts, guess, word))
    md = ['# 08 读音核对表（过稿用）', '', '> 由 `python3 production/pronounce.py` 按当前脚本自动生成，勿手改。',
          '> 过稿时只需要看「⚠️ 待确认」：确认读法后写进 `production/pronounce.tsv`，再跑一次，直到没有待确认。', '',
          f'## ⚠️ 待确认（{len(warn)}）', '', '| 字 | 上下文 | 合成会读 | 拼音库判断 | 合成按哪个词切 |', '|---|---|---|---|---|']
    md += [f'| **{c}** | {x} | {t} | {g} | {w} |' for c, x, t, g, w in warn] or ['| — | 没有待确认的字 | | | |']
    md += ['', f'## ✅ 本稿用到的已确认读音（{len(used)}）', '', '| 词 | 读音 | 说明 |', '|---|---|---|']
    md += [f'| {w} | {py} | {n} |' for w, (py, n) in sorted(used.items())]
    seen = {}
    for c, x, t, g, w in ok:
        seen.setdefault((c, t), x)
    md += ['', f'## · 其他多音字（合成与拼音库一致，扫一眼即可，共 {len(seen)} 种）', '', '| 字 | 读音 | 例句片段 |', '|---|---|---|']
    md += [f'| {c} | {t} | {x} |' for (c, t), x in sorted(seen.items())]
    open(os.path.join(ROOT, '08-读音核对表.md'), 'w', encoding='utf8').write('\n'.join(md) + '\n')
    if '--lexicon' in sys.argv:
        out = sys.argv[sys.argv.index('--lexicon') + 1]
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, 'w', encoding='utf8') as f:
            for w, (py, _) in cur.items():
                f.write(f'{w} {tokens(py)}\n')
            f.write(open(BASE_LEX, encoding='utf8').read())
        print('合成词典 →', out)
    print(f'待确认 {len(warn)} 处；本稿用到已确认读音 {len(used)} 个 → 08-读音核对表.md')
    sys.exit(1 if warn else 0)

if __name__ == '__main__':
    main()
