"""出片后复核：从成片里把音频按句切开，逐句用 SenseVoice 再听一遍。
合成阶段两个识别模型只要一个听对就放行；这里只用一个模型，更严，专门抓「勉强过关」的句子和混音、编码引入的问题。
用法：python3 final_check.py <输出目录>（out/video/<期>/）
"""
import json, re, subprocess, sys, os
import soundfile as sf
import pron
from tts import load_asr, diff, heard_tokens, heard_chars


def main():
    out = sys.argv[1]
    mp4 = [f for f in os.listdir(out) if f.endswith('.mp4')][0]
    wav = os.path.join(out, 'final16k.wav')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', os.path.join(out, mp4), '-ac', '1', '-ar', '16000', wav], check=True)
    tl = json.load(open(os.path.join(out, 'timeline.json')))['beats']
    beats = json.load(open(os.path.join(out, 'beats.json')))['beats']
    x, sr = sf.read(wav, dtype='float32')
    sv = load_asr()[0][1]
    bad = []
    for i, (b, t) in enumerate(zip(beats, tl)):
        s = sv.create_stream()
        s.accept_waveform(sr, x[int((t['start'] - 0.05) * sr):int((t['end'] + 0.1) * sr)])
        sv.decode_stream(s)
        h = s.result.text
        norm, _, chars = pron.analyze(b['text'])
        disp = []
        for tok in re.findall(rf'[{pron.ZH}]|[A-Za-z][A-Za-z\-]*', norm):
            disp += [pron.show(tok)] if re.match(rf'[{pron.ZH}]', tok) else ([pron.WORD_LETTER[tok]] if tok in pron.WORD_LETTER else list(tok.replace('-', '')))
        e, iss, _ = diff(pron.expect(norm, chars), disp, heard_tokens(h), heard_chars(h))
        if e:
            bad.append(f'第 {i + 1} 句：{"；".join(iss)}（听到：{h}）')
    for b in bad:
        print('  ✗ ' + b)
    print(f'成片复核：{len(beats) - len(bad)}/{len(beats)} 句听对')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
