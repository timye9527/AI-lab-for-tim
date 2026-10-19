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


OVERRIDES, DISPUTED = {}, {}
for row in _load('pron.txt'):
    w, *py = row.split()
    # 行尾写「?」的是争议读音：词典读法和日常听感可能不一致，每期都列出来请主理人拍板
    if py and py[-1] == '?':
        py = py[:-1]
        DISPUTED[w] = py
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
                out += [(c, p, '争议' if w in DISPUTED else '词表') for c, p in zip(w, OVERRIDES[w])]
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
        if src in ('词表', '争议') or c not in '一不':
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


# 词典最容易在上下文里取错音的字，读音表里单独列出来，按语境逐个判断（规则见 读音规范.md「多音字语境规则」）
RISKY = set('得了着量冲转还行长重调差数处为地和便降空给传应曾朝种相将少好中当发角结系场只背薄难参血塞累折露')
# 这些字绝大多数时候读常见音，读成常见音就不列，免得噪音盖住真问题
USUAL = {'了': 'le5', '和': 'he2', '给': 'gei3', '还': 'hai2', '地': 'di4', '中': 'zhong1', '场': 'chang3', '只': 'zhi3',
         '参': 'can1', '种': 'zhong3', '结': 'jie2', '难': 'nan2', '少': 'shao3', '好': 'hao3', '背': 'bei4', '相': 'xiang1',
         '应': 'ying1', '朝': 'chao2', '曾': 'ceng2', '将': 'jiang1', '薄': 'bo2', '血': 'xue4', '塞': 'sai1', '累': 'lei4',
         '折': 'zhe2', '露': 'lu4', '系': 'xi4', '发': 'fa1', '角': 'jiao3'}

# 语境规则：这些搭配里要读少见音。词典没读成这个音时，读音表标出「按语境应读 X」
CONTEXT = [
    (r'还(?=了?[钱债款贷账])', 'huan2', '还钱、还债的「还」'),
    (r'(?<=[归偿退])还', 'huan2', '归还、偿还的「还」'),
    (r'(?<=[几一两三四五六七八九十多每])只(?=[股票基鸡鸟船手])', 'zhi1', '量词「几只股票」'),
    (r'中(?=[奖标毒弹签])', 'zhong4', '中奖、中标的「中」'),
    (r'(?<=[打命猜])中', 'zhong4', '打中、命中的「中」'),
    (r'好(?=[奇学客胜色战])', 'hao4', '好奇、好学的「好」'),
    (r'(?<=[爱喜嗜偏])好', 'hao4', '爱好、偏好的「好」'),
    (r'应(?=[用对付聘答变激邀])', 'ying4', '应用、应对的「应」'),
    (r'(?<=[回响反适供相呼答])应', 'ying4', '回应、供应的「应」'),
    (r'难(?=[民友])', 'nan4', '难民的「难」'),
    (r'(?<=[灾遇患苦落逃避发责劫])难', 'nan4', '灾难、遇难的「难」'),
    (r'少(?=[年女将爷])', 'shao4', '少年的「少」'),
    (r'种(?=[植地树田菜])', 'zhong4', '种植的「种」'),
    (r'(?<=[耕播接])种', 'zhong4', '播种、接种的「种」'),
    (r'相(?=[机貌声片册])', 'xiang4', '相机、相貌的「相」'),
    (r'(?<=[真首宰丞照面亮])相', 'xiang4', '真相、首相的「相」'),
    (r'参(?=差)', 'cen1', '参差的「参」'),
    (r'背(?=[包负着起])', 'bei1', '背包、背负的「背」'),
    (r'结(?=[实巴])', 'jie1', '结实的「结」'),
    (r'(?<=[头理])发', 'fa4', '头发、理发的「发」'),
    (r'发(?=[型廊丝])', 'fa4', '发型的「发」'),
    (r'(?<=[主配])角', 'jue2', '主角、配角的「角」'),
    (r'角(?=[色逐斗])', 'jue2', '角色、角逐的「角」'),
    (r'朝(?=[阳气晖夕])', 'zhao1', '朝阳的「朝」'),
    (r'曾(?=[孙祖])', 'zeng1', '曾孙的「曾」'),
    (r'(?<=[单稀刻])薄', 'bo2', '单薄、稀薄的「薄」'),
    (r'(?<=[露雪])露', 'lu4', '露的读音'),
]


def risky(c, py, prev=''):
    """需要人工重点审的字：高风险字里，读法不是最常见的那种；或「了」前面是「不」「得」（可能该读 liǎo）。"""
    if c not in RISKY:
        return False
    if c == '了' and prev in '不得':
        return True
    return USUAL.get(c) != py


def context_hits(chars):
    """按语境规则检查：命中搭配但读音不是规则要求的，返回 [(位置, 字, 现读, 应读, 说明)]。"""
    text = ''.join(c for c, _, _ in chars)
    out = []
    for pat, want, why in CONTEXT:
        for m in re.finditer(pat, text):
            k = m.start()
            c, py, src = chars[k]
            if py != want and src not in ('词表', '争议'):
                out.append((k, c, py, want, why))
    return out


def is_poly(c):
    return len(pinyin(c, heteronym=True, style=Style.TONE3)[0]) > 1
