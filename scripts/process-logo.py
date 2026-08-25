from pathlib import Path

from PIL import Image

src = Path(
    r"C:\Users\caio.santana\Downloads\ChatGPT Image 25 de ago. de 2026, 09_30_44.png"
)
root = Path(r"D:\DEV\SalesOps-Industrial-Demo")
img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if r < 28 and g < 28 and b < 28:
            pixels[x, y] = (r, g, b, 0)

bbox = img.getbbox()
if bbox:
    pad = 24
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(w, bbox[2] + pad)
    bottom = min(h, bbox[3] + pad)
    img = img.crop((left, top, right, bottom))

brand = root / "public" / "brand"
brand.mkdir(parents=True, exist_ok=True)
logo = brand / "logo.png"
img.save(logo, optimize=True)

side = max(img.size)
square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
ox = (side - img.size[0]) // 2
oy = (side - img.size[1]) // 2
square.paste(img, (ox, oy), img)

outputs = [
    (512, brand / "logo-512.png"),
    (192, brand / "icon-192.png"),
    (32, brand / "favicon-32.png"),
    (180, root / "app" / "apple-icon.png"),
    (512, root / "app" / "icon.png"),
]

for size, path in outputs:
    out = square.resize((size, size), Image.Resampling.LANCZOS)
    out.save(path, optimize=True)

print("saved", logo, "size", img.size)
for _, path in outputs:
    print(" ", path)
