# 标贝配音的降噪：声码器在词与词之间留下的底噪偏高（比峰值只低约 19 dB），这里压到 30 dB 以上
# 做法：用最安静的帧当噪声样本做谱降噪 + 柔和的向下扩展 + 7.4 kHz 低通，最后提一点齿音清晰度
# 用法：python voice_clean.py <输入.wav> <输出.wav>
import numpy as np, soundfile as sf, noisereduce as nr
from scipy import signal
SR = 24000
def floor_db(x):
    f, t, Z = signal.stft(x, SR, nperseg=480, noverlap=240); e = 10 * np.log10((np.abs(Z) ** 2).sum(0) + 1e-20); e = e[e > -150]
    return np.percentile(e, 92) - np.percentile(e, 12)
def clean(x, prop=0.9, exp_db=10, thr_below=24):
    # 1 用最安静的帧当噪声样本，做平稳谱降噪
    f, t, Z = signal.stft(x, SR, nperseg=480, noverlap=240); e = (np.abs(Z) ** 2).sum(0); nzf = e > 1e-15
    q = np.percentile(e[nzf], 15); quiet = np.flatnonzero(nzf & (e <= q))
    noise = np.concatenate([x[i * 240: i * 240 + 480] for i in quiet]) if len(quiet) > 5 else x[:2400]
    y = nr.reduce_noise(y=x, sr=SR, y_noise=noise, stationary=True, prop_decrease=prop, n_fft=1024, freq_mask_smooth_hz=120, time_mask_smooth_ms=30)
    # 2 柔和的向下扩展：低于峰值 thr_below dB 的部分再压低，最多 exp_db dB
    env = np.sqrt(signal.lfilter([1 - 0.995], [1, -0.995], y ** 2)) + 1e-9
    lvl = 20 * np.log10(env); peak = np.percentile(lvl[lvl > -100], 95)
    under = np.clip((peak - thr_below) - lvl, 0, None)
    g_db = -np.minimum(under * 0.8, exp_db)
    g_db = signal.filtfilt(*signal.butter(1, 30 / (SR / 2)), g_db)   # 平滑，避免抽吸
    y = y * 10 ** (g_db / 20)
    # 3 梅尔谱只到 7.6 kHz，以上都是声码器噪声
    b, a = signal.butter(6, 7400 / (SR / 2)); y = signal.filtfilt(b, a, y)
    return y.astype(np.float32)

def highshelf(x, f0=4500, gain_db=3.5):
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f0 / SR; al = np.sin(w) / (2 * 0.707); c = np.cos(w); sq = 2 * np.sqrt(A) * al
    b = [A * ((A + 1) + (A - 1) * c + sq), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sq)]
    a = [(A + 1) - (A - 1) * c + sq, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sq]
    return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x).astype(np.float32)

def final(x):
    """定稿的处理链：中等降噪 + 提回齿音清晰度"""
    return highshelf(clean(x, prop=0.75, exp_db=6, thr_below=27))

if __name__ == "__main__":
    import sys
    x, _ = sf.read(sys.argv[1]); y = final(x)
    print(f"{sys.argv[1]}  词间底噪 {floor_db(x):.1f} → {floor_db(y):.1f} dB")
    sf.write(sys.argv[2], y, SR)
