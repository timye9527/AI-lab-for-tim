import sys
from PIL import Image, ImageFilter, ImageChops
src,out=sys.argv[1],sys.argv[2]
im=Image.open(src).convert('RGB')
box=(815,30,1075,152)            # logo + blue underline
sbox=(555,30,815,152)            # clean dark texture patch of same size
patch=im.crop(sbox)
reg=im.crop(box)
# mask: pixels that are clearly not the dark paper background (red/white logo, blue stroke)
m=Image.new('L',reg.size,0); rp=reg.load(); mp=m.load()
for y in range(reg.height):
    for x in range(reg.width):
        r,g,b=rp[x,y]
        if max(r,g,b)>95 or (b-r>25) or (r-g>35): mp[x,y]=255
m=m.filter(ImageFilter.MaxFilter(13)).filter(ImageFilter.GaussianBlur(4))
reg.paste(patch,(0,0),m)
im.paste(reg,box[:2])
im.save(out)
