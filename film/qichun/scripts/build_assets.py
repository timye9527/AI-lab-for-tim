# 把原始数据加工成渲染用的素材：地形高度、烘焙底图、建筑网格、高亮线
# 用法：python build_assets.py <原始数据目录> <输出目录>
import sys, os, json, math, struct
import numpy as np
import shapely, shapely.geometry as sg
from scipy import ndimage
from PIL import Image, ImageDraw

RAW, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

# 投影：以县域中心为原点的等距投影，单位米。x 向东，z 向南（three.js 习惯）
LON0, LAT0 = 115.57, 30.33
KX = 111320 * math.cos(math.radians(LAT0))
KY = 110574

def proj(lon, lat):
    return (np.asarray(lon) - LON0) * KX, -(np.asarray(lat) - LAT0) * KY

def load(name):
    return json.load(open(f"{RAW}/{name}.geojson"))["features"]

# ---------- 地形 ----------
meta_dem = json.load(open(f"{RAW}/dem.json"))
dem = np.load(f"{RAW}/dem.npy")
med = ndimage.median_filter(dem, 5)
dem = np.where(np.abs(dem - med) > 150, med, dem)  # 去掉瓦片里的尖刺
dem = np.clip(dem, 10, None)  # 江湖底部的水深数据不要，水面统一按 10 米
n = 2 ** meta_dem["z"]
H, W = dem.shape

def px_to_lonlat(px, py):
    lon = (meta_dem["tx0"] + px / 256) / n * 360 - 180
    lat = np.degrees(np.arctan(np.sinh(math.pi * (1 - 2 * (meta_dem["ty0"] + py / 256) / n))))
    return lon, lat

def lonlat_to_px(lon, lat):
    x = ((np.asarray(lon) + 180) / 360 * n - meta_dem["tx0"]) * 256
    y = ((1 - np.arcsinh(np.tan(np.radians(lat))) / math.pi) / 2 * n - meta_dem["ty0"]) * 256
    return x, y

# 地形范围：裁成规则的米制网格，四角经纬度
LON_A, LON_B, LAT_A, LAT_B = 115.12, 115.98, 29.87, 30.73
X0, Z1 = proj(LON_A, LAT_A)
X1, Z0 = proj(LON_B, LAT_B)
X0, X1, Z0, Z1 = float(X0), float(X1), float(Z0), float(Z1)
GRID = 60.0  # 网格高度采样间距（米）
gw, gh = int((X1 - X0) / GRID) + 1, int((Z1 - Z0) / GRID) + 1

def sample_dem(x, z):
    lon = np.asarray(x) / KX + LON0
    lat = -np.asarray(z) / KY + LAT0
    px, py = lonlat_to_px(lon, lat)
    return ndimage.map_coordinates(dem, [py - 0.5, px - 0.5], order=1, mode="nearest")

gx, gz = np.meshgrid(np.linspace(X0, X1, gw), np.linspace(Z0, Z1, gh))
hgrid = sample_dem(gx.ravel(), gz.ravel()).reshape(gh, gw).astype(np.float32)
hgrid = ndimage.gaussian_filter(hgrid, 0.6)
hgrid.astype("<f4").tofile(f"{OUT}/terrain_h.bin")
print("terrain grid", gw, gh, float(hgrid.max()))

# ---------- 烘焙底图 ----------
water = load("water")
wpoly = [sg.shape(f["geometry"]) for f in water if f["geometry"]["type"] in ("Polygon", "MultiPolygon")]
wline = {"river": [], "canal": [], "stream": []}
for f in water:
    if f["geometry"]["type"] == "LineString":
        wline.setdefault(f["properties"]["subtype"], []).append(sg.shape(f["geometry"]))
county_f = json.load(open(f"{RAW}/qichun_boundary.geojson"))
QC = sg.shape(county_f["geometry"])
rk = {"motorway": 34, "trunk": 26, "primary": 22, "secondary": 16, "tertiary": 12, "residential": 6, "unclassified": 6}
road_g = {}
for f in load("roads"):
    c = f["properties"]["class"]
    if c in rk:
        road_g.setdefault(rk[c], []).append(sg.shape(f["geometry"]))

def bake(ext, tw, name, road_min=0):
    """按米制范围 ext=(x0,z0,x1,z1) 烘焙一张底图和水面掩膜"""
    x0, z0, x1, z1 = ext
    th = int(tw * (z1 - z0) / (x1 - x0))
    tx, tz = np.meshgrid(np.linspace(x0, x1, tw), np.linspace(z0, z1, th))
    th_m = sample_dem(tx.ravel(), tz.ravel()).reshape(th, tw)
    cell = (x1 - x0) / tw
    sig = max(1.0, 30 / cell)  # 高程原始精度约 30 米，细图上先抹平再算阴影
    gy_, gx_ = np.gradient(ndimage.gaussian_filter(th_m, sig), cell)
    az, alt = math.radians(315), math.radians(38)
    slope = np.arctan(np.hypot(gx_, gy_) * 1.6)
    aspect = np.arctan2(-gx_, gy_)
    shade = np.clip(np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect), 0, 1)

    def raster(geoms, width_m=0, fill=True):
        ss = 2
        im = Image.new("L", (tw * ss, th * ss), 0)
        dr = ImageDraw.Draw(im)
        sx = tw * ss / (x1 - x0)
        box = sg.box((x0 - 2000) / KX + LON0, -(z1 + 2000) / KY + LAT0, (x1 + 2000) / KX + LON0, -(z0 - 2000) / KY + LAT0)
        def tp(coords):
            c = np.asarray(coords)[:, :2]
            x, z = proj(c[:, 0], c[:, 1])
            return list(zip(((x - x0) * sx).tolist(), ((z - z0) * sx).tolist()))
        for g in geoms:
            if not g.intersects(box):
                continue
            for part in getattr(g, "geoms", [g]):
                if part.geom_type == "Polygon" and fill:
                    dr.polygon(tp(part.exterior.coords), fill=255)
                    for r in part.interiors:
                        dr.polygon(tp(r.coords), fill=0)
                elif part.geom_type == "LineString":
                    dr.line(tp(part.coords), fill=255, width=max(1, int(round(width_m * sx))))
        im = im.resize((tw, th), Image.LANCZOS)
        return np.asarray(im, np.float32) / 255

    m_water = np.maximum.reduce([raster(wpoly), raster(wline["river"], 45), raster(wline["canal"], 14), raster(wline["stream"], 10)])
    m_county = ndimage.gaussian_filter(raster([QC]), 1.5)
    m_border = raster([QC.boundary], max(70, cell * 1.5))
    m_road = np.maximum.reduce([raster(v, max(k, cell * 0.8)) for k, v in road_g.items() if k >= road_min])
    hn = np.clip((th_m - 10) / 1100, 0, 1)
    low = np.array([0.20, 0.17, 0.13]); high = np.array([0.62, 0.52, 0.38])
    base = low + (high - low) * (hn[..., None] ** 0.6)
    col = base * (0.35 + 0.95 * shade[..., None])
    col = col * (0.32 + 0.68 * m_county[..., None])
    ra = (m_road * 0.35 * m_county)[..., None]
    col = col * (1 - ra) + np.array([0.85, 0.72, 0.52]) * ra
    wcol = np.array([0.13, 0.33, 0.52]) * (0.75 + 0.25 * m_county[..., None])
    col = col * (1 - m_water[..., None]) + wcol * m_water[..., None]
    col = col * (1 - m_border[..., None] * 0.8) + np.array([1.0, 0.84, 0.55]) * m_border[..., None] * 0.8
    Image.fromarray((np.clip(col, 0, 1) ** (1 / 1.1) * 255).astype(np.uint8)).save(f"{OUT}/{name}_tex.jpg", quality=92)
    Image.fromarray((m_water * 255).astype(np.uint8)).save(f"{OUT}/{name}_mask.png")
    print("baked", name, tw, th)
    return th_m

TEX = 4096
th_m = bake((X0, Z0, X1, Z1), TEX, "terrain", road_min=12)
tw = TEX; th = th_m.shape[0]
tx, tz = np.meshgrid(np.linspace(X0, X1, tw), np.linspace(Z0, Z1, th))

# 细节贴片：蕲州、县城两处特写用
patches = {}
for name, (cx_, cz_, half) in {"qizhou": (-21500, 30800, 5000), "caohe": (-13500, 10500, 6500)}.items():
    ext = (cx_ - half, cz_ - half, cx_ + half, cz_ + half)
    bake(ext, 2048, name)
    patches[name] = ext

# ---------- 建筑 ----------
bf = load("buildings")
geoms = np.array([sg.shape(f["geometry"]) for f in bf], dtype=object)
cent = shapely.centroid(geoms)
shapely.prepare(QC)
keep = shapely.contains(QC, cent)
geoms = geoms[keep]
cent = cent[keep]
print("buildings in county", len(geoms))
cx, cz = proj(shapely.get_x(cent), shapely.get_y(cent))
base_h = sample_dem(cx, cz)
# 生长顺序：按到县域中心的距离加一点随机扰动，0..1
rng = np.random.default_rng(7)
dist = np.hypot(cx, cz)
order = (dist / dist.max()) * 0.8 + rng.random(len(dist)) * 0.2

pos, attr, idx = [], [], []
nv = 0
for i, g in enumerate(geoms):
    g = g.simplify(0.000006)
    if g.geom_type == "MultiPolygon":
        g = max(g.geoms, key=lambda p: p.area)
    if g.is_empty or g.geom_type != "Polygon":
        continue
    ring = np.asarray(g.exterior.coords)[:-1, :2]
    if len(ring) < 3:
        continue
    x, z = proj(ring[:, 0], ring[:, 1])
    k = len(ring)
    b = float(base_h[i])
    r = float(order[i])
    # 底圈 + 顶圈
    for j in range(k):
        pos += [x[j], b, z[j]]; attr += [0.0, r]
    for j in range(k):
        pos += [x[j], b, z[j]]; attr += [1.0, r]
    for j in range(k):
        a, c = j, (j + 1) % k
        idx += [nv + a, nv + c, nv + k + c, nv + a, nv + k + c, nv + k + a]
    # 屋顶：约束三角剖分
    tri = shapely.constrained_delaunay_triangles(sg.Polygon(ring))
    lut = {(round(p[0], 9), round(p[1], 9)): q for q, p in enumerate(ring)}
    for t in tri.geoms:
        cs = np.asarray(t.exterior.coords)[:3]
        try:
            idx += [nv + k + lut[(round(p[0], 9), round(p[1], 9))] for p in cs]
        except KeyError:
            pass
    nv += 2 * k

cen = np.column_stack([cx, base_h, cz, order]).astype("<f4")
cen.tofile(f"{OUT}/bcent.bin")
pos = np.asarray(pos, "<f4"); attr = np.asarray(attr, "<f4"); idx = np.asarray(idx, "<u4")
with open(f"{OUT}/buildings.bin", "wb") as fp:
    fp.write(struct.pack("<III", len(pos) // 3, len(idx), 0))
    fp.write(pos.tobytes()); fp.write(attr.tobytes()); fp.write(idx.tobytes())
print("building verts", len(pos) // 3, "tris", len(idx) // 3)

# ---------- 高亮折线（贴地） ----------
def line3d(geom, step=80):
    """折线按 step 米加密并贴到地形上"""
    out = []
    for part in getattr(geom, "geoms", [geom]):
        c = np.asarray(part.coords)[:, :2]
        x, z = proj(c[:, 0], c[:, 1])
        pts = [(x[0], z[0])]
        for a in range(1, len(x)):
            d = math.hypot(x[a] - x[a - 1], z[a] - z[a - 1])
            for s in range(1, max(1, int(d / step)) + 1):
                u = s / max(1, int(d / step))
                pts.append((x[a - 1] + (x[a] - x[a - 1]) * u, z[a - 1] + (z[a] - z[a - 1]) * u))
        p = np.asarray(pts)
        y = sample_dem(p[:, 0], p[:, 1])
        out.append(np.column_stack([p[:, 0], y, p[:, 1]]).round(1).tolist())
    return out

from shapely.ops import linemerge
qishui = linemerge([sg.shape(f["geometry"]) for f in water if (f["properties"]["names"] or {}).get("primary") == "蕲水"])
rail = load("rail")
hsr = linemerge([sg.shape(f["geometry"]) for f in rail if (f["properties"]["names"] or {}).get("primary") == "阜黄高速线"])
cj = linemerge([sg.shape(f["geometry"]) for f in water if (f["properties"]["names"] or {}).get("primary") == "长江"])
lines = {
    "qishui": line3d(qishui),
    "hsr": line3d(hsr.intersection(QC.buffer(0.08))),
    "yangtze": line3d(cj.intersection(sg.box(LON_A, LAT_A, LON_B, LAT_B))),
    "border": line3d(QC.exterior if QC.geom_type == "Polygon" else max(QC.geoms, key=lambda p: p.area).exterior, 150),
}

# 雨湖、赤东湖中心
def named_centroid(name):
    for f in water:
        if (f["properties"]["names"] or {}).get("primary") == name:
            c = sg.shape(f["geometry"]).representative_point()
            return c.x, c.y

def pt(lon, lat, lift=0):
    x, z = proj(lon, lat)
    return [round(float(x), 1), round(float(sample_dem([x], [z])[0]) + lift, 1), round(float(z), 1)]

# 县内最高点
ins = shapely.contains_xy(QC, *(np.asarray(v) for v in (tx.ravel() / KX + LON0, -tz.ravel() / KY + LAT0)))
hh = np.where(ins, th_m.ravel(), -1)
im_ = int(hh.argmax())
peak_lon, peak_lat = tx.ravel()[im_] / KX + LON0, -tz.ravel()[im_] / KY + LAT0

points = {
    "lishizhen_tomb": pt(115.35333, 30.04611),       # Overture places：李时珍墓
    "lishizhen_museum": pt(115.346918, 30.049647),   # Overture places：李时珍纪念馆
    "yuhu": pt(*named_centroid("雨湖")),
    "chidonghu": pt(*named_centroid("赤东湖")),
    "caohe": pt(115.43303, 30.23704),                # Overture places：蕲春（县城漕河）
    "peak": pt(peak_lon, peak_lat),
}

meta = {
    "origin": [LON0, LAT0], "kx": KX, "ky": KY,
    "extent": [X0, Z0, X1, Z1], "grid": [gw, gh],
    "tex": [tw, th], "patches": patches, "peak_m": round(float(hh.max())),
    "buildings": int(len(geoms)),
    "points": points, "lines": lines,
}
json.dump(meta, open(f"{OUT}/meta.json", "w"), ensure_ascii=False)
print("points", points, "peak", meta["peak_m"])
