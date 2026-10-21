# 下载 AWS Terrain Tiles（Terrarium 编码）并拼成一张高程栅格（米）
import sys, os, math, io, urllib.request
import numpy as np
from PIL import Image

Z = 12
BBOX = (115.10, 29.85, 116.00, 30.75)

def tile_xy(lon, lat, z):
    n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y

def main(out):
    x0, y1 = tile_xy(BBOX[0], BBOX[1], Z)
    x1, y0 = tile_xy(BBOX[2], BBOX[3], Z)
    tx0, tx1, ty0, ty1 = int(x0), int(x1), int(y0), int(y1)
    W, H = (tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256
    dem = np.zeros((H, W), np.float32)
    for ty in range(ty0, ty1 + 1):
        for tx in range(tx0, tx1 + 1):
            url = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{tx}/{ty}.png"
            im = np.asarray(Image.open(io.BytesIO(urllib.request.urlopen(url, timeout=60).read())).convert("RGB")).astype(np.float32)
            h = im[..., 0] * 256 + im[..., 1] + im[..., 2] / 256 - 32768
            dem[(ty - ty0) * 256:(ty - ty0 + 1) * 256, (tx - tx0) * 256:(tx - tx0 + 1) * 256] = h
    np.save(f"{out}/dem.npy", dem)
    # 记录栅格左上角对应的瓦片坐标，便于换算经纬度
    with open(f"{out}/dem.json", "w") as f:
        f.write(f'{{"z": {Z}, "tx0": {tx0}, "ty0": {ty0}, "w": {W}, "h": {H}}}')
    print("dem", dem.shape, float(dem.min()), float(dem.max()))

main(sys.argv[1])
