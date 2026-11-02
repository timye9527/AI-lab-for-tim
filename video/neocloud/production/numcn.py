#!/usr/bin/env python3
"""阿拉伯数字 → 中文读法（只用于配音文本，字幕不变）。

克隆模型会把阿拉伯数字当英文读（「10 月 10 号」→ ten 月 ten 号），所以送去合成前全部转成汉字。
规则：年份逐位读（2027 年 → 二零二七年）；百分号、小数、千位以上按数值读；2 在量词前读「两」。
"""
import re

D = '零一二三四五六七八九'

def _under_10k(n):
    s, units = '', ['千', '百', '十', '']
    digits = f'{n:04d}'
    zero = False
    for d, u in zip(digits, units):
        if d == '0':
            zero = bool(s)
            continue
        if zero:
            s += '零'; zero = False
        s += D[int(d)] + u
    return s

def int_cn(n):
    if n == 0:
        return '零'
    parts, out = [], ''
    for unit in ['', '万', '亿', '万亿']:
        parts.append((n % 10000, unit)); n //= 10000
        if not n:
            break
    for i, (v, unit) in enumerate(reversed(parts)):
        if v == 0:
            continue
        seg = _under_10k(v)
        if out and v < 1000:
            seg = '零' + seg
        out += seg + unit
    out = re.sub('零+', '零', out).rstrip('零')
    return out[1:] if out.startswith('一十') else out

def num_cn(s):
    if '.' in s:
        a, b = s.split('.')
        return int_cn(int(a)) + '点' + ''.join(D[int(c)] for c in b)
    return int_cn(int(s))

def to_chinese(text):
    t = text.replace(',', '')
    yr = lambda m: ''.join(D[int(c)] for c in m.group(1))
    t = re.sub(r'(\d{4})(?=\s*(?:、|和|到|至)\s*\d{4}\s*年)', yr, t)  # 年份并列：2027、2028 年
    t = re.sub(r'(\d{4})(?=\s*年)', yr, t)
    t = re.sub(r'[−-](\d+(?:\.\d+)?)\s*%', lambda m: '跌百分之' + num_cn(m.group(1)), t)
    t = re.sub(r'(\d+(?:\.\d+)?)\s*%', lambda m: '百分之' + num_cn(m.group(1)), t)
    t = re.sub(r'\$\s*(\d+(?:\.\d+)?)\s*(万亿|亿)', lambda m: num_cn(m.group(1)) + m.group(2) + '美元', t)
    t = re.sub(r'(?<![\d.])2(?=\s*(个|份|倍|家|层|次|年|天|周|位|刀|成|到\s*\d))', '两', t)
    t = re.sub(r'\d+(?:\.\d+)?', lambda m: num_cn(m.group(0)), t)
    t = re.sub(r'(?<![一二三四五六七八九十])二(?=[百千万亿])', '两', t)  # 二百亿 → 两百亿
    t = t.replace('−', '')
    return re.sub(r'(?<=[一-鿿])\s+(?=[一-鿿])', '', t)

if __name__ == '__main__':
    for s in ['10 月 10 号', '海力士跌了 26%，三星跌了 22%。', '2027、2028 年', '2013 年', '107 万亿韩元', '1.4 万亿美元',
              '2 到 3 倍', '4 到 7 倍', '26 份长期供货协议', '500 亿美元', '200 亿', '10 月 27、28 号', '−$7000亿', '300 亿美元', '54 万亿韩元', '2031 年', '7 月底']:
        print(s, '→', to_chinese(s))
