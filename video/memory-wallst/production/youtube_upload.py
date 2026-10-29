#!/usr/bin/env python3
"""用 YouTube Data API 上传视频、缩略图（只用 Python 标准库）。

一次性准备（Google Cloud 控制台，你本人操作）：
  1. 新建项目 → 启用「YouTube Data API v3」
  2. OAuth 同意屏幕：外部；把你自己的 Google 账号加为测试用户
  3. 凭据 → 创建 OAuth 客户端 ID，类型选「电视和输入受限的设备」
  4. 把客户端 ID / 密钥设成环境变量 YT_CLIENT_ID / YT_CLIENT_SECRET（不要写进仓库）
授权（设备码流程）：  python3 production/youtube_upload.py auth
  → 屏幕上给出网址和验证码，在手机或电脑上打开、登录频道账号、确认；令牌存到 out/youtube/token.json（不入库）
上传：               python3 production/youtube_upload.py upload [视频路径]
  → 读 out/final/youtube.json（youtube_meta.py 生成），断点续传上传，再设缩略图

注意：没通过 Google 审核的 API 项目，上传的视频会被锁成「私享」，审核通过前改不成公开。
"""
import json, os, sys, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOKEN = os.path.join(ROOT, 'out', 'youtube', 'token.json')
SCOPE = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube'


def post(url, data, headers=None):
    body = urllib.parse.urlencode(data).encode() if isinstance(data, dict) else data
    req = urllib.request.Request(url, data=body, headers=headers or {}, method='POST')
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()


def creds():
    cid, sec = os.environ.get('YT_CLIENT_ID'), os.environ.get('YT_CLIENT_SECRET')
    if not cid or not sec:
        sys.exit('先设置环境变量 YT_CLIENT_ID 和 YT_CLIENT_SECRET（见文件开头说明）')
    return cid, sec


def auth():
    cid, sec = creds()
    st, _, b = post('https://oauth2.googleapis.com/device/code', {'client_id': cid, 'scope': SCOPE})
    d = json.loads(b)
    if st != 200:
        sys.exit(f'申请设备码失败：{d}')
    print(f"\n请在手机或电脑上打开：{d['verification_url']}\n输入验证码：{d['user_code']}\n然后登录你的频道账号并允许。\n", flush=True)
    while True:
        time.sleep(d.get('interval', 5))
        st, _, b = post('https://oauth2.googleapis.com/token', {'client_id': cid, 'client_secret': sec, 'device_code': d['device_code'],
                                                                'grant_type': 'urn:ietf:params:oauth:grant-type:device_code'})
        t = json.loads(b)
        if st == 200:
            os.makedirs(os.path.dirname(TOKEN), exist_ok=True)
            json.dump(t, open(TOKEN, 'w'))
            print('授权成功，令牌已保存（不入库）')
            return
        if t.get('error') not in ('authorization_pending', 'slow_down'):
            sys.exit(f'授权失败：{t}')


def access_token():
    cid, sec = creds()
    t = json.load(open(TOKEN))
    st, _, b = post('https://oauth2.googleapis.com/token', {'client_id': cid, 'client_secret': sec, 'refresh_token': t['refresh_token'], 'grant_type': 'refresh_token'})
    if st != 200:
        sys.exit(f'刷新令牌失败，重新跑 auth：{b[:200]}')
    return json.loads(b)['access_token']


def upload(path):
    meta = json.load(open(os.path.join(ROOT, 'out', 'final', 'youtube.json'), encoding='utf8'))
    tok = access_token()
    body = {'snippet': {k: meta[k] for k in ('title', 'description', 'tags', 'categoryId', 'defaultLanguage', 'defaultAudioLanguage')},
            'status': {'privacyStatus': meta['privacyStatus'], 'selfDeclaredMadeForKids': meta['selfDeclaredMadeForKids'],
                       'containsSyntheticMedia': meta['containsSyntheticMedia']}}
    size = os.path.getsize(path)
    st, h, b = post('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', json.dumps(body).encode(),
                    {'Authorization': f'Bearer {tok}', 'Content-Type': 'application/json; charset=UTF-8',
                     'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': str(size)})
    if st != 200:
        sys.exit(f'创建上传会话失败：{st} {b[:300]}')
    loc = h.get('Location') or h.get('location')
    chunk, sent, vid = 16 * 1024 * 1024, 0, None
    with open(path, 'rb') as f:
        while sent < size:
            data = f.read(chunk)
            req = urllib.request.Request(loc, data=data, method='PUT', headers={'Authorization': f'Bearer {tok}', 'Content-Length': str(len(data)),
                                                                                 'Content-Range': f'bytes {sent}-{sent + len(data) - 1}/{size}'})
            try:
                with urllib.request.urlopen(req) as r:
                    vid = json.loads(r.read())['id']
            except urllib.error.HTTPError as e:
                if e.code != 308:
                    sys.exit(f'上传中断：{e.code} {e.read()[:300]}')
            sent += len(data)
            print(f'已上传 {sent * 100 // size}%', flush=True)
    print('视频 ID：', vid, f'https://youtu.be/{vid}')
    thumb = os.path.join(ROOT, 'out', 'final', 'thumbnail.jpg')
    st, _, b = post(f'https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={vid}', open(thumb, 'rb').read(),
                    {'Authorization': f'Bearer {tok}', 'Content-Type': 'image/jpeg'})
    print('缩略图：', '已设置' if st == 200 else f'失败（{st}，频道需要先完成手机验证）')
    print('提醒：未通过审核的 API 项目上传的视频会被锁成私享；字幕请在 Studio 上传 out/final/subtitles.srt')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'auth':
        auth()
    elif cmd == 'upload':
        upload(sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'out', 'final', '存储复盘-一周五刀.mp4'))
    else:
        print(__doc__)
