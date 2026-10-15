import sys, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont
SHOTS, ROOT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True)
GOWUN = os.path.join(ROOT, 'assets/fonts/GowunDodum-Regular.ttf')
BOLD = 'C:/Windows/Fonts/malgunbd.ttf'
CREAM, INK, GREEN, MUTED = (250,246,239), (38,34,28), (91,123,74), (120,110,96)

def rrect_mask(size, r):
    m = Image.new('L', size, 0); ImageDraw.Draw(m).rounded_rectangle([0,0,size[0]-1,size[1]-1], r, fill=255); return m

def phone(name):
    s = Image.open(os.path.join(SHOTS, name)).convert('RGB')  # 1080x2400
    b = 36; W, H = s.width + 2*b, s.height + 2*b
    ph = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(ph)
    d.rounded_rectangle([0,0,W-1,H-1], 150, fill=(24,24,26))
    d.rounded_rectangle([6,6,W-7,H-7], 145, outline=(70,70,74), width=3)
    ph.paste(s, (b,b), rrect_mask(s.size, 116))
    cx = W//2; d.ellipse([cx-22, b+34, cx+22, b+78], fill=(10,10,12))
    # side buttons
    d.rounded_rectangle([W-4, 520, W+0, 700], 3, fill=(40,40,44))
    return ph

def shadowed(ph, blur=60, off=40, alpha=90):
    pad = blur*3
    c = Image.new('RGBA', (ph.width+2*pad, ph.height+2*pad), (0,0,0,0))
    sh = Image.new('RGBA', ph.size, (40,30,20,alpha)); sh.putalpha(ph.split()[3].point(lambda v: alpha if v else 0))
    c.alpha_composite(sh, (pad, pad+off)); c = c.filter(ImageFilter.GaussianBlur(blur))
    c.alpha_composite(ph, (pad, pad)); return c, pad

def scaled(img, h): return img.resize((round(img.width*h/img.height), h), Image.LANCZOS)

shots = [('home.png','한눈에 보는 유통기한'),('detail.png','항목 등록·수정'),('detail2.png','개봉 후 사용기한 & 알림'),
         ('settings.png','알림 시각 설정'),('home_dark.png','다크 모드 지원')]
phones = {n: phone(n) for n,_ in shots}

# 1) individual framed PNGs (transparent)
for n,_ in shots:
    phones[n].save(os.path.join(OUT, 'frame_'+n))

# 2) hero 3200x1800
W,H = 3200,1800
hero = Image.new('RGBA', (W,H), CREAM+(255,))
g = ImageDraw.Draw(hero)
g.ellipse([1500,-500,3700,1700], fill=(232,238,224))
g.ellipse([2300,900,3600,2300], fill=(243,233,214))
icon = Image.open(os.path.join(ROOT,'assets/images/icon.png')).convert('RGBA').resize((200,200), Image.LANCZOS)
hero.paste(icon, (200,530), rrect_mask((200,200),46))
g.text((200, 790), '언제까지?', font=ImageFont.truetype(BOLD, 150), fill=INK)
g.text((205, 990), '유통기한·개봉 후 사용기한을 기록하고\n만료 전에 알림을 받는 앱', font=ImageFont.truetype(GOWUN, 62), fill=MUTED, spacing=22)
for name, cx, top, h in [('detail2.png',1790,330,1300), ('home_dark.png',2910,330,1300), ('home.png',2350,190,1480)]:
    p, pad = shadowed(scaled(phones[name], h))
    hero.alpha_composite(p, (cx - p.width//2, top - pad))
hero.convert('RGB').save(os.path.join(OUT,'hero.png'))

# 3) overview strip with captions
ph_h = 1500; gap = 140; margin = 180
ps = [scaled(phones[n], ph_h) for n,_ in shots]
W = sum(p.width for p in ps) + gap*(len(ps)-1) + 2*margin; H = ph_h + 420
ov = Image.new('RGBA', (W,H), CREAM+(255,)); g = ImageDraw.Draw(ov)
fc = ImageFont.truetype(GOWUN, 58); x = margin
for (n,cap), p in zip(shots, ps):
    tw = g.textlength(cap, font=fc); g.text((x + (p.width-tw)/2, 120), cap, font=fc, fill=INK)
    sp, pad = shadowed(p, blur=40, off=30, alpha=70)
    ov.alpha_composite(sp, (x - pad, 280 - pad)); x += p.width + gap
ov.convert('RGB').save(os.path.join(OUT,'overview.png'))
print('ok')
