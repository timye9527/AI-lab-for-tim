# 用 Tim 本人录音做参考，离线合成旁白（ZipVoice 全精度模型，sherpa-onnx）
# 处理链：全精度模型 16 步 → 按原声长时频谱做 EQ 校正 → 4.5kHz 以上 +4.5dB（补回明亮度）
# 用法：
#   ZIPVOICE=sherpa-onnx-zipvoice-zh-en-emilia  （全精度 text_encoder.onnx / fm_decoder.onnx）
#   ZIPVOICE_LEX=sherpa-onnx-zipvoice-distill-int8-zh-en-emilia  （lexicon.txt / tokens.txt / espeak-ng-data）
#   VOCODER=vocos_24khz.onnx REF=参考录音片段.wav REF_TEXT='片段原文' REF_FULL=完整原声.wav \
#   python3 scripts/vo-clone.py assets/vo-tim/full '{"l1":"两年前，提姆第一次来到E O E。"}' [语速]
# 模型：sherpa-onnx GitHub releases 的 tts-models / vocoder-models
# 念法：Tim 写成「提姆」、EOE 写成「E O E」；太短的句子（如「没想到……」）和下一句合在一起
# 参考录音和合成结果是个人声音，不要提交进仓库
import json, os, subprocess, sys
import numpy as np, sherpa_onnx, soundfile as sf
from numpy.fft import irfft, rfft, rfftfreq

M = os.environ['ZIPVOICE'].rstrip('/') + '/'
L = os.environ['ZIPVOICE_LEX'].rstrip('/') + '/'
cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(zipvoice=sherpa_onnx.OfflineTtsZipvoiceModelConfig(
    tokens=L + 'tokens.txt', encoder=M + 'text_encoder.onnx', decoder=M + 'fm_decoder.onnx', vocoder=os.environ['VOCODER'],
    data_dir=L + 'espeak-ng-data', lexicon=L + 'lexicon.txt'), num_threads=4))
tts = sherpa_onnx.OfflineTts(cfg)
prompt, psr = sf.read(os.environ['REF'], dtype='float32')
ref_full, _ = sf.read(os.environ['REF_FULL'], dtype='float32')


def ltas(x, sr, n=2048):
    w = np.hanning(n)
    acc = np.zeros(n // 2 + 1)
    k = 0
    for i in range(0, len(x) - n, n // 2):
        s = x[i:i + n]
        if np.sqrt((s ** 2).mean()) < 0.01:
            continue
        acc += np.abs(rfft(s * w)) ** 2
        k += 1
    return acc / max(k, 1)


def eq_match(x, sr):
    # 合成音的长时频谱向原声靠拢（1/3 倍频程平滑，±6dB 封顶）
    n = 2048
    f = rfftfreq(n, 1 / sr)
    d = 10 * np.log10(ltas(ref_full, sr) + 1e-12) - 10 * np.log10(ltas(x, sr) + 1e-12)
    sm = np.array([d[(f >= fi / 2 ** (1 / 6)) & (f <= fi * 2 ** (1 / 6))].mean() if fi > 0 else d[0] for fi in f])
    sm -= np.median(sm[(f > 200) & (f < 4000)])
    sm = np.clip(sm, -6, 6)
    h = np.fft.fftshift(irfft(10 ** (sm / 20)))
    h *= np.hanning(len(h))
    return np.convolve(x, h, mode='same')


out, lines = sys.argv[1], json.loads(sys.argv[2])
speed = float(sys.argv[3]) if len(sys.argv) > 3 else 1.05
os.makedirs(out, exist_ok=True)
durs_path = os.path.join(out, 'durations.json')
durs = json.load(open(durs_path)) if os.path.exists(durs_path) else {}
for k, text in lines.items():
    a = tts.generate(text, os.environ['REF_TEXT'], prompt.tolist(), psr, speed=speed, num_steps=16)
    x = np.array(a.samples, dtype=np.float32)
    idx = np.where(np.abs(x) > 0.012)[0]
    x = x[max(0, idx[0] - 480): idx[-1] + 720]
    x = eq_match(x, a.sample_rate)
    tmp = os.path.join(out, f'{k}.raw.wav')
    sf.write(tmp, (x / (np.abs(x).max() + 1e-9) * 0.9).astype(np.float32), a.sample_rate)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', tmp, '-af', 'highshelf=f=4500:g=4.5,alimiter=limit=0.95',
                    '-c:a', 'pcm_s16le', os.path.join(out, f'{k}.wav')], check=True)
    os.remove(tmp)
    durs[k] = round(len(x) / a.sample_rate, 3)
    print(k, durs[k], text, flush=True)
    json.dump(durs, open(durs_path, 'w'), indent=1, ensure_ascii=False)
