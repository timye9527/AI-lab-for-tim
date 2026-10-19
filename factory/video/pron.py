"""读音模块：把口播稿转成「每个字读什么」，由我们决定，不交给配音模型去猜。

流程：读法替换（符号、个别英文）→ 英文缩写转字母读法 → 数字转中文读法 → 覆盖词表优先
→ 其余用 pypinyin 按词取音 →「一」「不」变调 → 生成附加词典条目，让模型逐字照读。
缩写里的字母换成私有区字符（U+E000 起）嵌进中文词条，读法见 letters.txt。
"""
import os, re
from pypinyin import pinyin, lazy_pinyin, Style

HERE = os.path.dirname(os.path.abspath(__file__))
DIGITS = '零一二三四五六七八九'
NUMCHARS = set('零一二三四五六七八九十百千万亿两点')


def _load(name):
    rows = []
    for line in open(os.path.join(HERE, name), encoding='utf-8'):
        line = line.split('#', 1)[0].strip()
        if line:
            rows.append(line)
    return rows


OVERRIDES = {}
for row in _load('pron.txt'):
    w, *py = row.split()
    OVERRIDES[w] = py
READS = []
for row in _load('read.txt'):
    a, b = [x.strip() for x in row.split('=>')]
    READS.append((a, b))
MAXW = max(len(w) for w in OVERRIDES)

# 字母：拼音（中文音节读）、英文单词（英文引擎读）或 None（读不准）
LETTER_PY, LETTER_WORD, ACRONYMS = {}, {}, {}
for row in _load('letters.txt'):
    k, rest = row.split(None, 1)
    if len(k) == 1:
        if rest == '✗':
            LETTER_PY[k] = None
        elif rest.startswith('='):
            LETTER_WORD[k] = rest[1:]
        else:
            LETTER_PY[k] = rest
    else:
        ACRONYMS[k] = [x.strip() for x in rest.split('/')]
PUA = 0xE000
WORD_LETTER = {w: k for k, w in LETTER_WORD.items()}
ZH = r'\u4e00-\u9fff\ue000-\ue0ff'


def pua(c):
    return chr(PUA + ord(c) - 65)


def is_pua(c):
    return PUA <= ord(c) < PUA + 26


def unpua(c):
    return chr(ord(c) - PUA + 65)


def _acronym(m):
    word = m.group(0)
    bad = [c for c in word if LETTER_PY.get(c, '') is None]
    if bad:
        raise ValueError(f'「{word}」里的字母 {"、".join(bad)} 配音读不准，请改写（例如写中文全称）')
    out = ''
    for c in word:
        out += f' {LETTER_WORD[c]} ' if c in LETTER_WORD else pua(c)
    return out


def int_cn(n):
    """整数转中文读法，支持到千亿。"""
    if n == 0:
        return '零'
    def four(x):
        s, zero = '', False
        for i, unit in ((1000, '千'), (100, '百'), (10, '十'), (1, '')):
            d = x // i % 10
            if d:
                if zero:
                    s += '零'
                s += DIGITS[d] + unit
                zero = False
            elif s:
                zero = True
        return s
    parts, s = [], ''
    for unit in ('亿', '万', ''):
        base = {'亿': 10**8, '万': 10**4, '': 1}[unit]
        x = n // base % 10000 if unit != '亿' else n // base
        if x:
            if s and x < 1000:
                s += '零'
            s += four(x) + unit
        elif s and not s.endswith('零'):
            s += '零'
    s = s.rstrip('零')
    if s.startswith('一十'):
        s = s[1:]
    # 千、万、亿前面的「二」读「两」
    return re.sub(r'(^|零)二(?=[千万亿])', r'\1两', s)


def num_cn(m):
    s = m.group(0)
    if '.' in s:
        a, b = s.split('.')
        return int_cn(int(a)) + '点' + ''.join(DIGITS[int(c)] for c in b)
    return int_cn(int(s))


def normalize(text):
    """只影响配音的读法：缩写、符号、数字。"""
    for a, b in READS:
        text = text.replace(a, b)
    # 全大写缩写和单个大写字母，按字母读
    text = re.sub(r'(?<![A-Za-z])[A-Z]+(?![a-z])', _acronym, text)
    # 年份逐位读：带「年」的四位数，以及「中国制造2025」这类编号。其他四位数按数值读
    text = re.sub(r'(?<=制造)(\d{4})(?!\d)', lambda m: ''.join(DIGITS[int(c)] for c in m.group(1)), text)
    text = re.sub(r'(\d{4})(?=\s*年)', lambda m: ''.join(DIGITS[int(c)] for c in m.group(1)), text)
    # 百分比和区间
    text = re.sub(r'(\d+(?:\.\d+)?)\s*[–\-~～]\s*(\d+(?:\.\d+)?)\s*%', lambda m: '百分之' + num_cn(re.match(r'.*', m.group(1))) + '到' + num_cn(re.match(r'.*', m.group(2))), text)
    text = re.sub(r'(\d+(?:\.\d+)?)\s*%', lambda m: '百分之' + num_cn(re.match(r'.*', m.group(1))), text)
    text = re.sub(r'(\d+)\s*[–\-~～]\s*(\d+)', lambda m: int_cn(int(m.group(1))) + '到' + int_cn(int(m.group(2))), text)
    # 「2个」这类读「两」
    text = re.sub(r'(?<![\d.])2(?=[个位条只种家项次])', '两', text)
    text = re.sub(r'\d+(?:\.\d+)?', num_cn, text)
    # 符号
    text = re.sub(r'[·《》“”"‘’（）()]', '', text)
    text = text.replace('、', '，').replace('—', '，').replace('…', '。')
    # 中英文之间留空格，英文按词读
    text = re.sub(rf'(?<=[{ZH}])(?=[A-Za-z])|(?<=[A-Za-z])(?=[{ZH}])', ' ', text)
    return re.sub(r'[ \t]+', ' ', text).strip()


def _tone(s):
    return int(s[-1]) if s[-1].isdigit() else 5


def g2p_run(run):
    """一段汉字（可夹缩写字母）→ [(字, 拼音, 来源)]。来源：词表 / 词典 / 变调 / 字母。"""
    out, i = [], 0
    while i < len(run):
        if is_pua(run[i]):
            j = i
            while j < len(run) and is_pua(run[j]):
                j += 1
            word = ''.join(unpua(c) for c in run[i:j])
            pys = ACRONYMS.get(word) or [LETTER_PY[c] for c in word]
            out += [(c, p, '字母') for c, p in zip(run[i:j], pys)]
            i = j
            continue
        for L in range(min(MAXW, len(run) - i), 0, -1):
            w = run[i:i + L]
            if w in OVERRIDES:
                out += [(c, p, '词表') for c, p in zip(w, OVERRIDES[w])]
                i += L
                break
        else:
            # 到下一个覆盖词之前的一段交给 pypinyin 按词取音
            j = i + 1
            while j < len(run) and not is_pua(run[j]) and not any(run[j:j + L] in OVERRIDES for L in range(1, MAXW + 1)):
                j += 1
            seg = run[i:j]
            pys = lazy_pinyin(seg, style=Style.TONE3, neutral_tone_with_five=True)
            out += [(c, p, '词典') for c, p in zip(seg, pys)]
            i = j
    # 「一」「不」变调，词表里写死的不动
    for k, (c, p, src) in enumerate(out):
        if src == '词表' or c not in '一不':
            continue
        nxt = out[k + 1][1].split()[0] if k + 1 < len(out) else None
        prev = out[k - 1][0] if k else ''
        if c == '一' and 0 < k < len(out) - 1 and out[k - 1][0] == out[k + 1][0]:
            np = 'yi5'  # 看一看、想一想
        elif c == '一':
            num_ctx = prev in NUMCHARS or prev == '第' or (k + 1 < len(out) and out[k + 1][0] in NUMCHARS)
            if nxt is None or num_ctx:
                np = 'yi1'
            else:
                np = 'yi2' if _tone(nxt) == 4 else 'yi4'
        else:
            if p == 'bu5':
                continue
            np = 'bu2' if nxt and _tone(nxt) == 4 else 'bu4'
        if np != p:
            out[k] = (c, np, '变调')
    return out


def analyze(text):
    """口播稿 → (配音用文本, 附加词典条目 {词: 拼音}, 逐字读音)。"""
    norm = normalize(text)
    entries, chars = {}, []
    for run in re.findall(rf'[{ZH}]+', norm):
        res = g2p_run(run)
        chars += res
        # 每 10 个字一条（模型最长按 10 字匹配），保证整段按我们的读音走
        for s in range(0, len(res), 10):
            part = res[s:s + 10]
            w = ''.join(c for c, _, _ in part)
            py = [x for _, p, _ in part for x in p.split()]
            if w in entries and entries[w] != py:
                raise ValueError(f'同一串字在不同句子里读音不同：{w} {entries[w]} / {py}，请在 pron.txt 里加词')
            entries[w] = py
    return norm, entries, chars


MARKS = {'a': 'āáǎà', 'o': 'ōóǒò', 'e': 'ēéěè', 'i': 'īíǐì', 'u': 'ūúǔù', 'v': 'ǖǘǚǜ'}


def expect(norm, chars):
    """预期听到的音节序列（不带声调），给回听比对用：汉字是拼音，字母是小写字母，英文单词拆成字母。"""
    out, k = [], 0
    for tok in re.findall(rf'[{ZH}]|[A-Za-z][A-Za-z\-]*', norm):
        if re.match(rf'[{ZH}]', tok):
            c, p, _ = chars[k]
            k += 1
            out.append(unpua(c).lower() if is_pua(c) else re.sub(r'\d', '', p))
        elif tok in WORD_LETTER:
            out.append(WORD_LETTER[tok].lower())
        else:
            out += list(tok.lower().replace('-', ''))
    return out


def show(c):
    return unpua(c) if is_pua(c) else c


def mark(p):
    """yi2 → yí，方便人看；多音节逐个转。"""
    if ' ' in p:
        return ' '.join(mark(x) for x in p.split())
    t = _tone(p)
    s = p.rstrip('12345')
    if t == 5:
        return s.replace('v', 'ü')
    for v in ('a', 'e', 'ou'):
        if v in s:
            idx = s.index(v)
            break
    else:
        idx = max(s.rfind(c) for c in 'iouv')
    return (s[:idx] + MARKS[s[idx]][t - 1] + s[idx + 1:]).replace('v', 'ü')


# 词典最容易在上下文里取错音的字，读音表里单独列出来重点审
RISKY = set('得了着量冲转还行长重调差数处为地和便降空给传')
# 这些读法是绝大多数情况，不再列出，免得噪音盖住真问题
USUAL = {'了': 'le5', '和': 'he2', '给': 'gei3', '还': 'hai2', '地': 'di4'}


def risky(c, py, prev=''):
    """需要人工重点审的字：高风险字里，读法不是最常见的那种；或「了」前面是「不」「得」（可能该读 liǎo）。"""
    if c not in RISKY:
        return False
    if c == '了' and prev in '不得':
        return True
    return USUAL.get(c) != py


def is_poly(c):
    return len(pinyin(c, heteronym=True, style=Style.TONE3)[0]) > 1
