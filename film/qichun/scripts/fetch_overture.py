# 从 Overture Maps（公开 S3）按范围抽取蕲春的数据，存成 GeoJSON
import sys, json, os
import pyarrow.dataset as ds
import pyarrow.fs as pafs
import pyarrow.compute as pc
import shapely.wkb, shapely.geometry

REL = "overturemaps-us-west-2/release/2026-09-23.0"
# 蕲春县大致范围（经纬度），再向外留一点余量
BBOX = (115.10, 29.85, 116.00, 30.75)

def fs():
    proxy = os.environ.get("HTTPS_PROXY", "")
    kw = dict(anonymous=True, region="us-west-2")
    if proxy:
        kw["proxy_options"] = proxy
    ca = "/root/.ccr/ca-bundle.crt"
    if os.path.exists(ca):
        kw["tls_ca_file_path"] = ca
    return pafs.S3FileSystem(**kw)

def fetch(theme, typ, cols, extra=None, bbox=BBOX):
    d = ds.dataset(f"{REL}/theme={theme}/type={typ}/", filesystem=fs(), format="parquet")
    x0, y0, x1, y1 = bbox
    f = ((pc.field("bbox", "xmin") < x1) & (pc.field("bbox", "xmax") > x0) &
         (pc.field("bbox", "ymin") < y1) & (pc.field("bbox", "ymax") > y0))
    if extra is not None:
        f = f & extra
    t = d.to_table(columns=cols + ["geometry"], filter=f)
    feats = []
    for row in t.to_pylist():
        g = shapely.wkb.loads(row.pop("geometry"))
        feats.append({"type": "Feature", "properties": row, "geometry": shapely.geometry.mapping(g)})
    return {"type": "FeatureCollection", "features": feats}

if __name__ == "__main__":
    out = sys.argv[1]
    jobs = sys.argv[2:]
    os.makedirs(out, exist_ok=True)
    spec = {
        "county": ("divisions", "division_area", ["id", "names", "subtype", "class", "country", "region"],
                   pc.field("subtype").isin(["county", "locality", "localadmin", "region"])),
        "water": ("base", "water", ["id", "names", "subtype", "class"], None),
        "roads": ("transportation", "segment", ["id", "names", "subtype", "class"],
                  pc.field("subtype") == "road"),
        "rail": ("transportation", "segment", ["id", "names", "subtype", "class"],
                 pc.field("subtype") == "rail"),
        "buildings": ("buildings", "building", ["id", "height", "num_floors", "class", "sources"], None),
        "places": ("places", "place", ["id", "names", "basic_category", "confidence"], None),
        "land": ("base", "land_use", ["id", "names", "subtype", "class"], None),
    }
    for j in jobs:
        theme, typ, cols, extra = spec[j]
        fc = fetch(theme, typ, cols, extra)
        with open(f"{out}/{j}.geojson", "w") as fp:
            json.dump(fc, fp, ensure_ascii=False, default=str)
        print(j, len(fc["features"]), flush=True)
