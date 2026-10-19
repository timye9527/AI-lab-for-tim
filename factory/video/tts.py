"""逐句合成配音，每句合成后自动回听质检，不合格就重读；拼成整条音轨，输出时间轴、读音表和配音质检结果。

用法：python3 tts.py <beats.json> <输出目录> [读音表.md] [--recheck]
beats.json：{"voice": {"speed"}, "beats": [{"text", "gap"}]}

读音由 pron.py 决定：每句生成附加词典条目，模型逐字照读，不靠它自己猜多音字。
质检：SenseVoice 和 Paraformer 两个识别模型各转写一遍，转成不带声调的拼音，和稿子逐音节比对。
多字、漏字、读成别的音（比如「套利」读成「套号利」）都会被抓到；同音字不算错。
不合格就换手法重新合成（原样 → 微调语速 → 拆短句），最多 MAX_TRY 次，取错得最少的一次。声调对不对识别模型听不出来，靠读音表人工审。
--recheck：之前重试用完仍不合格的句子，再试一轮。
"""
import hashlib, json, os, re, sys, difflib
import numpy as np
import soundfile as sf
import sherpa_onnx
import pron
from pypinyin import lazy_pinyin, Style

ROOT = os.path.dirname(os.path.abspath(__file__))
M = os.path.join(ROOT, '..', '.cache', 'models') + '/'
D = M + 'matcha-icefall-zh-en/'
MAX_TRY = 8
NOISE = 0.667  # 默认 1.0 时偶发重复音节更多


def load_tts(lexicon):
    cfg = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            matcha=sherpa_onnx.OfflineTtsMatchaModelConfig(
                acoustic_model=D + 'model-steps-3.onnx', vocoder=M + 'vocos-16khz-univ.onnx',
                lexicon=lexicon, tokens=D + 'tokens.txt', data_dir=D + 'espeak-ng-data', noise_scale=NOISE),
            num_threads=4))
    return sherpa_onnx.OfflineTts(cfg)


def load_asr():
    P = M + 'sherpa-onnx-paraformer-zh-2024-03-09/'
    S = M + 'sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2024-07-17/'
    return [
        ('SenseVoice', sherpa_onnx.OfflineRecognizer.from_sense_voice(model=S + 'model.int8.onnx', tokens=S + 'tokens.txt', use_itn=False, num_threads=4)),
        ('Paraformer', sherpa_onnx.OfflineRecognizer.from_paraformer(paraformer=P + 'model.int8.onnx', tokens=P + 'tokens.txt', num_threads=4)),
    ]


def trim(x, sr, thr=0.01):
    # 去掉首尾静音，停顿统一由 gap 控制
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    return x[max(idx[0] - int(0.03 * sr), 0):min(idx[-1] + int(0.08 * sr), len(x))]


def heard_tokens(text):
    """识别结果 → 每个音节可能的读音集合（不带声调）。多音字取全部读音，听到「得」既算 de 也算 dei。"""
    from pypinyin import pinyin
    out = []
    for tok in re.findall(r'[\u4e00-\u9fff]|[A-Za-z]+|\d+', text):
        if tok.isdigit():
            out += [{x} for x in lazy_pinyin(pron.int_cn(int(tok)), style=Style.NORMAL)]
        elif re.match(r'[A-Za-z]', tok):
            out += [{c} for c in tok.lower()]
        else:
            out.append(set(pinyin(tok, heteronym=True, style=Style.NORMAL)[0]))
    return out


def heard_chars(text):
    """和 heard_tokens 一一对应的原字，问题描述里给人看。"""
    out = []
    for tok in re.findall(r'[\u4e00-\u9fff]|[A-Za-z]+|\d+', text):
        if tok.isdigit():
            out += list(pron.int_cn(int(tok)))
        elif re.match(r'[A-Za-z]', tok):
            out += list(tok.lower())
        else:
            out.append(tok)
    return out


# 轻声虚词读得轻、被识别模型漏掉，不算失败，只记为轻微
LIGHT = set('的了着地得吗呢吧啊么')


def diff(exp, disp, hyp, hyp_disp=None):
    """逐音节比对（编辑距离），返回 (严重错误数, 问题列表, 轻微问题列表)。"""
    n, m = len(exp), len(hyp)
    d = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        d[i][0] = i
    for j in range(m + 1):
        d[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (exp[i - 1] not in hyp[j - 1]))
    ops, i, j = [], n, m
    while i or j:
        if i and j and d[i][j] == d[i - 1][j - 1] + (exp[i - 1] not in hyp[j - 1]):
            ops.append(('=' if exp[i - 1] in hyp[j - 1] else 'r', i - 1, j - 1))
            i, j = i - 1, j - 1
        elif i and d[i][j] == d[i - 1][j] + 1:
            ops.append(('d', i - 1, None))
            i -= 1
        else:
            ops.append(('i', i, j - 1))
            j -= 1
    ops.reverse()
    errs, issues, minor = 0, [], []
    k = 0
    while k < len(ops):
        if ops[k][0] == '=':
            k += 1
            continue
        g = k
        while g < len(ops) and ops[g][0] != '=':
            g += 1
        grp = ops[k:g]
        a = [o[1] for o in grp if o[0] in 'rd']
        a1 = a[0] if a else grp[0][1]
        a2 = a[-1] + 1 if a else a1
        heard = ''.join(hyp_disp[o[2]] if hyp_disp else sorted(hyp[o[2]])[0] for o in grp if o[2] is not None)
        ctx = ''.join(disp[max(a1 - 2, 0):a1]) + '【' + ''.join(disp[a1:a2]) + '】' + ''.join(disp[a2:a2 + 2])
        if all(o[0] == 'd' for o in grp) and all(disp[o[1]] in LIGHT for o in grp):
            minor.append(f'{ctx} 读得轻，识别模型没听到')
        else:
            errs += len(grp)
            if not a:
                issues.append(f'{ctx} 处多出「{heard}」')
            elif not heard:
                issues.append(f'{ctx} 没读出来')
            else:
                issues.append(f'{ctx} 听成了「{heard}」（应为 {" ".join(exp[a1:a2])}）')
        k = g
    return errs, issues, minor


def synth(tts, text, speed, split):
    """合成一句。split 时按标点拆成短句分别合成再拼接，短句不容易出重复音节。"""
    parts = [x for x in re.split(r'(?<=[，。；：？！])', text) if x.strip()] if split else [text]
    pieces, sr = [], None
    for part in parts:
        a = tts.generate(part, sid=0, speed=speed)
        sr = a.sample_rate
        pieces += [trim(np.array(a.samples, dtype=np.float32), sr), np.zeros(int(0.12 * sr), dtype=np.float32)]
    return np.concatenate(pieces[:-1]), sr


# 重读策略：前 3 次原样，再 2 次微调语速，最后 3 次拆成短句合成
PLAN = [(1.0, False)] * 3 + [(0.96, False), (1.04, False)] + [(1.0, True)] * 3


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    src, out = args[0], args[1]
    sheet = args[2] if len(args) > 2 else None
    spec = json.load(open(src, encoding='utf-8'))
    voice = spec['voice']
    cache = os.path.join(out, 'cache')
    os.makedirs(cache, exist_ok=True)

    # 1. 读音分析，汇总附加词典
    tokens = {l.split()[0] for l in open(D + 'tokens.txt', encoding='utf-8') if l.strip()}
    entries, plans = {}, []
    for i, b in enumerate(spec['beats']):
        try:
            norm, ent, chars = pron.analyze(b['text'])
        except ValueError as e:
            raise SystemExit(f'第 {i + 1} 句：{e}\n  {b["text"]}')
        for w, py in ent.items():
            bad = [p for p in py if p not in tokens]
            if bad:
                raise SystemExit(f'模型没有这些音节：{bad}（{w}），检查 pron.txt / letters.txt')
            if w in entries and entries[w] != py:
                raise SystemExit(f'同一串字在不同句子里读音不同：{w}，请在 pron.txt 里加词')
            entries[w] = py
        disp = []
        for tok in re.findall(rf'[{pron.ZH}]|[A-Za-z][A-Za-z\-]*', norm):
            disp += [pron.show(tok)] if re.match(rf'[{pron.ZH}]', tok) else ([pron.WORD_LETTER[tok]] if tok in pron.WORD_LETTER else list(tok.replace('-', '')))
        key = hashlib.md5(json.dumps([norm, ent, voice, 'matcha-zh-en', NOISE], ensure_ascii=False).encode()).hexdigest()[:12]
        plans.append({'norm': norm, 'chars': chars, 'expect': pron.expect(norm, chars), 'disp': disp,
                      'path': os.path.join(cache, key + '.wav'), 'qc': os.path.join(cache, key + '.json')})
    lex = os.path.join(cache, 'lexicon.txt')
    with open(lex, 'w', encoding='utf-8') as f:
        for w, py in entries.items():
            f.write(f'{w} {" ".join(py)}\n')
        # 原词典里和附加条目重复的词跳过，附加条目优先
        for line in open(D + 'lexicon.txt', encoding='utf-8'):
            if line.split(' ', 1)[0] not in entries:
                f.write(line)

    # 2. 合成 + 回听质检，不合格重读
    tts, asr = None, None
    recheck = '--recheck' in sys.argv
    import librosa
    for i, p in enumerate(plans):
        if os.path.exists(p['path']) and os.path.exists(p['qc']):
            q = json.load(open(p['qc'], encoding='utf-8'))
            if q['errs'] == 0 or not recheck:
                p['result'] = q
                continue
        tts = tts or load_tts(lex)
        asr = asr or load_asr()
        best = None
        for t, (k, split) in enumerate(PLAN[:MAX_TRY], 1):
            x, sr = synth(tts, p['norm'], voice.get('speed', 1.0) * k, split)
            y = librosa.resample(x, orig_sr=sr, target_sr=16000) if sr != 16000 else x
            heard = {}
            for name, r in asr:
                st = r.create_stream()
                st.accept_waveform(16000, y)
                r.decode_stream(st)
                heard[name] = st.result.text
            # 两个识别模型取错得少的那个：只要有一个完整听对，说明音频本身没问题
            scored = [(diff(p['expect'], p['disp'], heard_tokens(h), heard_chars(h)), n) for n, h in heard.items()]
            (errs, issues, minor), name = min(scored, key=lambda z: (z[0][0], len(z[0][2])))
            if best is None or errs < best['errs']:
                best = {'errs': errs, 'issues': issues, 'minor': minor, 'heard': heard[name], 'by': name}
                sf.write(p['path'], x, sr)
            if errs == 0:
                break
        best['tries'] = t
        json.dump(best, open(p['qc'], 'w', encoding='utf-8'), ensure_ascii=False)
        p['result'] = best
        flag = '✓' if best['errs'] == 0 else '✗'
        print(f'  {flag} 第 {i + 1} 句（试 {t} 次）' + ('' if best['errs'] == 0 else '：' + '；'.join(best['issues'])))

    # 3. 拼接
    pieces, timeline, t, sr0 = [], [], 0.0, None
    for b, p in zip(spec['beats'], plans):
        x, sr = sf.read(p['path'], dtype='float32')
        if sr0 is None:
            sr0 = sr
            pieces.append(np.zeros(int(0.35 * sr), dtype=np.float32))
            t = 0.35
        timeline.append({'start': round(t, 3), 'end': round(t + len(x) / sr, 3), 'wav': p['path']})
        pieces += [x, np.zeros(int(b['gap'] * sr), dtype=np.float32)]
        t += len(x) / sr + b['gap']
    audio = np.concatenate(pieces)
    audio *= 0.89 / max(np.abs(audio).max(), 1e-6)
    sf.write(os.path.join(out, 'voice.wav'), audio, sr0)
    json.dump({'duration': round(t, 3), 'beats': timeline}, open(os.path.join(out, 'timeline.json'), 'w'), indent=1)
    fails = [(i + 1, p['result']) for i, p in enumerate(plans) if p['result']['errs']]
    minors = [(i + 1, p['result']) for i, p in enumerate(plans) if not p['result']['errs'] and p['result'].get('minor')]
    retried = sum(1 for p in plans if p['result']['tries'] > 1)
    json.dump({'total': len(plans), 'retried': retried, 'fails': [{'beat': i, **r} for i, r in fails],
               'minor': [{'beat': i, 'minor': r['minor']} for i, r in minors]},
              open(os.path.join(out, 'qc-voice.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'配音 {len(timeline)} 句，总长 {t:.1f} 秒；回听质检：{len(plans) - len(fails)} 句通过，{retried} 句经过重读，{len(fails)} 句仍有问题')
    if sheet:
        write_sheet(sheet, spec['beats'], plans)


def write_sheet(path, beats, plans):
    """读音表：多音字、覆盖词、变调、字母都标出读法，数字和英文写出实际读法，给人逐句审。"""
    lines = ['# 读音表', '',
             '> 自动生成。括号里是配音实际读的拼音：只标多音字、覆盖表里的词、「一」「不」变调和英文字母。',
             '> 读错了就在 `factory/video/pron.txt` 加词；字母读法在 `letters.txt`，英文和符号的读法改 `read.txt`。', '']
    risky = []
    for i, p in enumerate(plans):
        ctx = {k: (want, why) for k, _, _, want, why in pron.context_hits(p['chars'])}
        hits = []
        for k, (c, py, src) in enumerate(p['chars']):
            if k in ctx:
                hits.append(f'{c}({pron.mark(py)}，按语境应读 {pron.mark(ctx[k][0])}：{ctx[k][1]})')
            elif src == '词典' and pron.risky(c, py, p['chars'][k - 1][0] if k else ''):
                hits.append(f'{c}({pron.mark(py)})')
        if hits:
            risky.append(f'- 第 {i + 1} 句：' + '、'.join(hits))
    disputed = {}
    for i, p in enumerate(plans):
        norm_zh = ''.join(c for c, _, _ in p['chars'])
        for w, py in pron.DISPUTED.items():
            if w in norm_zh:
                disputed.setdefault(w, []).append(i + 1)
    if disputed:
        lines += ['## 需要拍板：争议读音（词典读法和日常听感可能不一致）', '']
        lines += [f'- {w}：现在读 {pron.mark(" ".join(pron.DISPUTED[w]))}，出现在第 {"、".join(map(str, ns))} 句' for w, ns in disputed.items()]
        lines += ['', '> 拍板后：确认按词典读，就把 `pron.txt` 里这行末尾的「?」删掉；要改读法，就改拼音再删「?」；也可以改写稿子避开这个词。', '']
    if risky:
        lines += ['## 重点审：高风险字（由词典自动取音，没经过覆盖表）', '',
                  '> 逐个按语境判断：读出整句，想这个字在句子里是什么意思，再对照 `读音规范.md` 的「多音字语境规则」。', ''] + risky + ['']
    if disputed or risky:
        lines += ['## 逐句', '']
    for i, (b, p) in enumerate(zip(beats, plans)):
        marked, k = '', 0
        for c in re.sub(rf'[^{pron.ZH}]', '', p['norm']):
            ch, py, srcf = p['chars'][k]
            k += 1
            if srcf != '词典' or pron.is_poly(ch):
                marked += f'{pron.show(ch)}({pron.mark(py)})'
            else:
                marked += ch
        lines.append(f'{i + 1}. {marked}')
        plain = re.sub(r'[，。！？；：、,.!?;:\s]', '', b['text'])
        shown = ''.join(pron.show(c) for c in p['norm'])
        if plain != re.sub(r'[，。！？；：、,.!?;:\s]', '', shown):
            lines.append(f'   - 实际读作：{shown}')
    open(path, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')


if __name__ == '__main__':
    main()
