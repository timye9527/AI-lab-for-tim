# 素材处理：裁切、放大、遮罩，输出到 ../assets
# 用法：python3 -I prepare_assets.py <materials目录> <assets目录>
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

M = Path(sys.argv[1])
A = Path(sys.argv[2])
A.mkdir(parents=True, exist_ok=True)


def load(name):
    return Image.open(M / name).convert("RGB")


def save(im, name, q=90):
    im.save(A / name, quality=q, optimize=True)
    print(name, im.size)


# 预览图坐标 → 原图坐标
def box(scale, x0, y0, x1, y1):
    return tuple(round(v / scale) for v in (x0, y0, x1, y1))


# 1. 大合照：原图 + 底部渐暗版本（压字用）
photo = load("周年庆-大合照.jpg")
save(photo, "group_photo.jpg", 88)
w, h = photo.size
grad = Image.new("L", (1, h))
for y in range(h):
    t = max(0, (y - h * 0.52) / (h * 0.48))
    grad.putpixel((0, y), int(225 * t ** 1.4))
grad = grad.resize((w, h))
dark = Image.new("RGB", (w, h), (20, 18, 32))
save(Image.composite(dark, photo, grad), "group_photo_fade.jpg", 88)

# 2. 合照中真实举着的手举牌（与设计稿对照）
s = 1400 / 2048
save(photo.crop(box(s, 0, 300, 230, 440)), "sign_live_mom.jpg")
save(photo.crop(box(s, 395, 470, 680, 590)), "sign_live_bucket.jpg")

# 3. 手举牌设计稿：抠单个牌子（避开洋红色标注框）
signs = load("周年庆-手举牌设计.jpg")
s = 1400 / 1536
save(signs.crop(box(s, 365, 132, 676, 355)), "sign_design_mom.jpg")
save(signs.crop(box(s, 698, 405, 1006, 600)), "sign_design_bucket.jpg")
save(signs.crop(box(s, 40, 135, 342, 340)), "sign_design_promise.jpg")
save(signs.crop(box(s, 1030, 390, 1372, 600)), "sign_design_boss.jpg")

# 4. 大屏 PPT 总览：去掉顶部说明文字，只留页面网格
ov = load("周年庆-大屏PPT总览.jpg")
s = 1400 / 3016
save(ov.crop(box(s, 20, 92, 1382, 988)), "ppt_overview.jpg", 88)

# 5. 筹备分工表：只取 功能/环节/执行人 三列（不含费用、进度等列）
t = load("周年庆-筹备分工表-全.jpg")
s = 1400 / 1644
head = t.crop(box(s, 50, 13, 578, 37))
body = t.crop(box(s, 50, 40, 578, 864))
staff = Image.new("RGB", (head.width, head.height + body.height))
staff.paste(head, (0, 0))
staff.paste(body, (0, head.height))
save(staff, "staff_table.jpg")
# 局部放大：设计组 + 节目组（带表头）
part = staff.crop((0, 710, staff.width, staff.height))
zoom = Image.new("RGB", (head.width, head.height + part.height))
zoom.paste(head, (0, 0))
zoom.paste(part, (0, head.height))
zoom = zoom.resize((zoom.width * 2, zoom.height * 2), Image.LANCZOS)
save(zoom, "staff_zoom.jpg")

# 6. 活动日程表：整张
sch = load("周年庆-活动日程表.jpg")
save(sch, "schedule.jpg")

# 7. 邀请函长图：原图只有 267px 宽，分段放大
inv = load("周年庆-邀请函长图.jpg")
iw, ih = inv.size
save(inv.resize((iw * 3, ih * 3), Image.LANCZOS), "invite_full.jpg")
segs = {
    "invite_head.jpg": (0, 0, iw, 292),
    "invite_photos.jpg": (0, 680, iw, 1010),
    "invite_agenda.jpg": (0, 1275, iw, 1660),
}
for name, b in segs.items():
    c = inv.crop(b)
    c = c.resize((c.width * 4, c.height * 4), Image.LANCZOS)
    c = c.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    save(c, name)
print("invite segments y-range:", {k: (v[1], v[3]) for k, v in segs.items()}, "of", ih)

# 8. 抽奖网页 & 粤语工具：整张
save(load("周年庆-抽奖网页-Codex.jpg"), "lottery.jpg", 88)
save(load("粤语工具-Codex对话与网页.jpg"), "cantonese.jpg", 88)

# 9. 财经 Skills 表：整张
save(load("财经-Skills工作流表-EP63.jpg"), "skills_table.jpg")

# 10. 第三方参考：只取两张视频卡片（标题+封面），明确标注非本人作品
ref = load("参考-第三方频道小Lin说.jpg")
s = 1400 / 1496
save(ref.crop(box(s, 45, 638, 1392, 1112)), "ref_video_cards.jpg")

# 11. SOXL 系统页：主卡片
so = load("SOXL-系统页面-等待机会.jpg")
s = 1400 / 2930
save(so.crop(box(s, 0, 55, 1400, 540)), "soxl_page.jpg", 88)

# 12. Discord 推送：只取上半段（已打码部分保留原样）
dc = load("SOXL-Discord推送.jpg")
s = 1400 / 2622
save(dc.crop(box(s, 0, 0, 644, 760)), "soxl_discord.jpg")
