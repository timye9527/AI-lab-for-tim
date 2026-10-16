# 生成配音：离线 Kokoro v1.1-zh（Apache-2.0），经 sherpa-onnx 运行，不花钱、不联网
# 用法：KOKORO=/path/to/kokoro-multi-lang-v1_1 python3 scripts/vo.py
# 模型下载：https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_1.tar.bz2
import json, os, re, sys
import numpy as np, sherpa_onnx, soundfile as sf

ROOT = os.path.join(os.path.dirname(__file__), '..')
M = os.environ.get('KOKORO', 'kokoro-multi-lang-v1_1').rstrip('/') + '/'
SID = int(os.environ.get('SID', 58))  # 58 号男声：语速自然，Tim 发音准确
SPEED = float(os.environ.get('SPEED', 1.06))

# 念法修正：字幕照原文，配音用这里的写法（EOE 要逐个字母念）
SAY = {' EOE': 'E O E', 'Tim ': 'Tim'}

src = open(os.path.join(ROOT, 'src/timeline.js'), encoding='utf-8').read()
lines = re.findall(r"\{ id: '(\w+)', start: ([\d.]+), text: '([^']+)' \}", src)
if not lines:
    sys.exit('timeline.js 里没找到 VO')

cfg = sherpa_onnx.OfflineTtsConfig(
    model=sherpa_onnx.OfflineTtsModelConfig(
        kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
            model=M + 'model.onnx', voices=M + 'voices.bin', tokens=M + 'tokens.txt',
            data_dir=M + 'espeak-ng-data', dict_dir=M + 'dict',
            lexicon=M + 'lexicon-us-en.txt,' + M + 'lexicon-zh.txt'),
        num_threads=4),
    rule_fsts=M + 'date-zh.fst,' + M + 'phone-zh.fst,' + M + 'number-zh.fst')
tts = sherpa_onnx.OfflineTts(cfg)

out = os.path.join(ROOT, 'assets/vo')
os.makedirs(out, exist_ok=True)
durs = {}
for vid, _, text in lines:
    say = text
    for k, v in SAY.items():
        say = say.replace(k, v)
    a = tts.generate(say, sid=SID, speed=SPEED)
    x = np.array(a.samples, dtype=np.float32)
    # 切掉首尾静音，留 30ms
    idx = np.where(np.abs(x) > 0.01)[0]
    pad = int(0.03 * a.sample_rate)
    x = x[max(0, idx[0] - pad): idx[-1] + pad]
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    sf.write(os.path.join(out, f'{vid}.wav'), x, a.sample_rate, subtype='PCM_16')
    durs[vid] = round(len(x) / a.sample_rate, 3)
    print(vid, durs[vid], 's', say)
json.dump(durs, open(os.path.join(out, 'durations.json'), 'w'), indent=1)
