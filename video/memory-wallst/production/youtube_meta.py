#!/usr/bin/env python3
"""生成 YouTube 上传用的元数据：标题、简介（含章节时间戳）、标签、缩略图、字幕。

  python3 production/youtube_meta.py   → out/final/youtube.json、thumbnail.jpg、subtitles.srt，并刷新 10-YouTube上传包.md
章节来自 out/audio/timeline.json（配音后的真实时间）。
"""
import json, os, re, shutil, subprocess

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
FINAL = os.path.join(ROOT, 'out', 'final')

TITLE = '存储一周被砸26%！真凶不是长鑫｜SK海力士、三星、美光暴跌复盘【看懂AI主线】'
TITLES_ALT = [
    '内存股5天蒸发7000亿美元：长鑫4F²只是导火索，真正的炸药是AI的钱',
    'AI泡沫要破了？存储一周暴跌，周期到底消失了没有',
]
TAGS = ['存储', '内存', '存储芯片', 'DRAM', 'HBM', 'SK海力士', '三星', '美光', '长鑫存储', '4F2', 'AI泡沫',
        'AI投资', '半导体', '芯片股', '美股', '韩股', '周期股', '美联储加息', 'OpenAI', '博通', '马斯克', '看懂AI主线']
HOOK = '''这一周拿着存储的，大概都被砸懵了：SK海力士约 −26%，三星约 −22%，美光约 −11%，全球存储板块 5 天蒸发超过 7000 亿美元。
所有人都说是长鑫的 4F² 把韩国人打趴了——可同一条消息，周一只让海力士跌了 3%。这期只回答三个问题：长鑫到底有多可怕？AI 的钱还够不够？存储的周期，消失了吗？'''
TAIL = '''信息来源（按时间）：FT（10/8）、第一财经（10/10）、路透（10/12）、马斯克 X 帖（10/13）、《每日经济》（据 CNBC 转述）、彭博 / CNBC（10/15）、台积电三季报（10/15）、美银 / 高盛 / Counterpoint（10/15–16）。数字截至 2026 年 10 月 16 日；各方口径不一致的数据只用一致的部分。

本视频仅为行业信息整理，不构成任何投资建议。过往表现不代表未来。
本视频配音为 AI 合成。

#存储 #AI投资 #半导体'''


def chapters(tl):
    seen, rows = set(), []
    for l in tl['lines']:
        if l['sec'] in seen:
            continue
        seen.add(l['sec'])
        name = re.sub(r'^\[[^\]]*\]\s*', '', l['title'])
        if name.startswith('片头'):
            continue  # 片头只有 5 秒，不单列章节（YouTube 要求每章至少 10 秒）
        name = re.sub(r'^(冷开场|收尾)：', '', name)
        s = 0 if not rows else int(l['start'] - 0.5)
        rows.append(f'{s // 60:02d}:{s % 60:02d} {name}')
    return rows


def main():
    tl = json.load(open(os.path.join(ROOT, 'out', 'audio', 'timeline.json'), encoding='utf8'))
    ch = chapters(tl)
    desc = HOOK + '\n\n章节\n' + '\n'.join(ch) + '\n\n' + TAIL
    meta = {
        'title': TITLE, 'description': desc, 'tags': TAGS,
        'categoryId': '27',  # 教育；财经评论放这里更不容易被限流
        'defaultLanguage': 'zh-Hans', 'defaultAudioLanguage': 'zh-Hans',
        'privacyStatus': 'private', 'selfDeclaredMadeForKids': False, 'containsSyntheticMedia': True,
    }
    os.makedirs(FINAL, exist_ok=True)
    json.dump(meta, open(os.path.join(FINAL, 'youtube.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    # 缩略图：1280×720 JPG，< 2MB
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', os.path.join(FINAL, 'cover-a-wide.png'), '-vf', 'scale=1280:720', '-q:v', '3',
                    os.path.join(FINAL, 'thumbnail.jpg')], check=True)
    shutil.copy(os.path.join(ROOT, 'out', 'audio', 'subtitles.srt'), os.path.join(FINAL, 'subtitles.srt'))
    # 刷新上传包文档里的标题、简介
    p = os.path.join(ROOT, '10-YouTube上传包.md')
    md = open(p, encoding='utf8').read()
    md = re.sub(r'<!-- DESC -->[\s\S]*?<!-- /DESC -->', '<!-- DESC -->\n```\n' + desc + '\n```\n<!-- /DESC -->', md)
    open(p, 'w', encoding='utf8').write(md)
    print('标题：', TITLE, f'（{len(TITLE)} 字）')
    print('\n'.join(ch))
    print('→ out/final/youtube.json、thumbnail.jpg、subtitles.srt；10-YouTube上传包.md 已刷新')


if __name__ == '__main__':
    main()
