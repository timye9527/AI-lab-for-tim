# 导出 PDF、逐页图片和缩略图总览
# 用法：python3 -I render.py <pptx> <soffice.py 路径>
import subprocess
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

pptx = Path(sys.argv[1]).resolve()
soffice = sys.argv[2]
out = pptx.parent
subprocess.run([sys.executable, soffice, "--headless", "--convert-to", "pdf", "--outdir", str(out), str(pptx)],
               check=True, capture_output=True, timeout=600)
pdf = pptx.with_suffix(".pdf")

pages = out / "pages"
pages.mkdir(exist_ok=True)
for f in pages.glob("*.jpg"):
    f.unlink()
subprocess.run(["pdftoppm", "-jpeg", "-r", "110", str(pdf), str(pages / "slide")], check=True)
files = sorted(pages.glob("slide-*.jpg"))

# 缩略图总览：5 列
cols, tw, th, pad, cap = 5, 480, 270, 24, 34
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (pad + cols * (tw + pad), 90 + rows * (th + cap + pad)), (244, 243, 248))
d = ImageDraw.Draw(sheet)
font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", 30)
small = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", 18)
d.text((pad, 24), f"《动动嘴，让 AI 把活干了！》· 全 {len(files)} 页总览", fill=(30, 27, 46), font=font)
for i, f in enumerate(files):
    im = Image.open(f).resize((tw, th), Image.LANCZOS)
    x = pad + (i % cols) * (tw + pad)
    y = 90 + (i // cols) * (th + cap + pad)
    sheet.paste(im, (x, y))
    d.text((x, y + th + 6), f"{i + 1:02d}", fill=(232, 69, 44), font=small)
sheet.save(out / "缩略图总览.jpg", quality=88)
print(pdf, len(files), "pages")
