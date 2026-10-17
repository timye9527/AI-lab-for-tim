# 用 Tim 本人录音做参考，离线合成旁白（ZipVoice，sherpa-onnx）
# 用法：ZIPVOICE=模型目录 VOCODER=vocos_24khz.onnx REF=参考录音.wav REF_TEXT='参考录音的原文' \
#       python3 scripts/vo-clone.py assets/vo-tim '{"l1":"两年前，提姆第一次来到E O E。"}' [语速]
# 模型：https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/sherpa-onnx-zipvoice-distill-int8-zh-en-emilia.tar.bz2
#       https://github.com/k2-fsa/sherpa-onnx/releases/download/vocoder-models/vocos_24khz.onnx
# 念法：Tim 写成「提姆」、EOE 写成「E O E」；太短的句子（如「他跑了」）容易出错，前面加半句
# 参考录音是个人声音，不要提交进仓库
import json, os, sys
import numpy as np, sherpa_onnx, soundfile as sf

M = os.environ['ZIPVOICE'].rstrip('/') + '/'
cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(zipvoice=sherpa_onnx.OfflineTtsZipvoiceModelConfig(
    tokens=M + 'tokens.txt', encoder=M + 'encoder.int8.onnx', decoder=M + 'decoder.int8.onnx', vocoder=os.environ['VOCODER'],
    data_dir=M + 'espeak-ng-data', lexicon=M + 'lexicon.txt'), num_threads=4))
tts = sherpa_onnx.OfflineTts(cfg)
prompt, psr = sf.read(os.environ['REF'], dtype='float32')
out, lines = sys.argv[1], json.loads(sys.argv[2])
speed = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
os.makedirs(out, exist_ok=True)
durs = {}
for k, text in lines.items():
    a = tts.generate(text, os.environ['REF_TEXT'], prompt.tolist(), psr, speed=speed, num_steps=8)
    x = np.array(a.samples, dtype=np.float32)
    idx = np.where(np.abs(x) > 0.012)[0]
    x = x[max(0, idx[0] - 480): idx[-1] + 720]
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    sf.write(os.path.join(out, f'{k}.wav'), x, a.sample_rate, subtype='PCM_16')
    durs[k] = round(len(x) / a.sample_rate, 3)
    print(k, durs[k], text)
json.dump(durs, open(os.path.join(out, 'durations.json'), 'w'), indent=1)
