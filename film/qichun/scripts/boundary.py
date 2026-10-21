# 从 Overture 行政区里挑出蕲春县的边界，单独存一份
import sys, json
raw = sys.argv[1]
fc = json.load(open(f"{raw}/county.geojson"))
f = [f for f in fc["features"] if (f["properties"]["names"] or {}).get("primary") == "蕲春县"][0]
json.dump(f, open(f"{raw}/qichun_boundary.geojson", "w"), ensure_ascii=False)
print("ok", f["properties"]["id"])
