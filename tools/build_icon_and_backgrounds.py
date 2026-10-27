import math
import os
import random
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
CARDS_DIR = os.path.join(PUBLIC, "cards", "piacentine")
TEXTURES_DIR = os.path.join(PUBLIC, "textures")
BG_DIR = os.path.join(PUBLIC, "backgrounds")

os.makedirs(BG_DIR, exist_ok=True)


def build_app_icon():
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rich emerald-gold background
    for y in range(size):
        t = y / size
        r = int(18 * (1 - t) + 5 * t)
        g = int(88 * (1 - t) + 38 * t)
        b = int(52 * (1 - t) + 22 * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    mask = Image.new("L", (size, size), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.rounded_rectangle([(12, 12), (size - 12, size - 12)], radius=96, fill=255)
    img.putalpha(mask)

    border_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(border_layer)
    bdraw.rounded_rectangle(
        [(24, 24), (size - 24, size - 24)],
        radius=84,
        outline=(245, 190, 68, 235),
        width=9,
    )
    img = Image.alpha_composite(img, border_layer)

    # 3 iconic cards: Asso di Denari (00), Settebello (06), Re di Coppe (19)
    fan_specs = [
        ("00.webp", -18, -74, 16),
        ("06.webp", 0, 0, -10),
        ("19.webp", 18, 74, 16),
    ]

    for fname, angle, dx, dy in fan_specs:
        cpath = os.path.join(CARDS_DIR, fname)
        if not os.path.exists(cpath):
            continue
        card = Image.open(cpath).convert("RGBA")
        cw, ch = 190, 312
        card = card.resize((cw, ch), Image.Resampling.LANCZOS)

        card_canvas = Image.new("RGBA", (cw + 48, ch + 48), (0, 0, 0, 0))
        sdraw = ImageDraw.Draw(card_canvas)
        sdraw.rounded_rectangle(
            [(26, 30), (26 + cw, 30 + ch)],
            radius=16,
            fill=(0, 0, 0, 155),
        )
        card_canvas = card_canvas.filter(ImageFilter.GaussianBlur(9))
        card_canvas.paste(card, (24, 24), card)

        rotated = card_canvas.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
        rw, rh = rotated.size
        px = (size - rw) // 2 + dx
        py = (size - rh) // 2 + dy
        img.alpha_composite(rotated, (px, py))

    png_path = os.path.join(PUBLIC, "icon.png")
    ico_path = os.path.join(PUBLIC, "icon.ico")
    fav_path = os.path.join(PUBLIC, "favicon.png")

    img.save(png_path, format="PNG")
    img.resize((64, 64), Image.Resampling.LANCZOS).save(fav_path, format="PNG")
    img.save(
        ico_path,
        format="ICO",
        sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)],
    )
    print(f"Built custom icon: {png_path} and {ico_path}")


def tile_texture(tex_name: str, w: int, h: int) -> Image.Image:
    tpath = os.path.join(TEXTURES_DIR, tex_name)
    canvas = Image.new("RGBA", (w, h), (20, 20, 24, 255))
    if not os.path.exists(tpath):
        return canvas
    tile = Image.open(tpath).convert("RGBA")
    tw, th = tile.size
    for y in range(0, h, th):
        for x in range(0, w, tw):
            canvas.paste(tile, (x, y))
    return canvas


def apply_radial_lighting(
    base: Image.Image,
    center_rgb: tuple[int, int, int],
    edge_rgb: tuple[int, int, int],
    center_alpha: float = 0.25,
    edge_alpha: float = 0.82,
) -> Image.Image:
    w, h = base.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = overlay.load()
    cx, cy = w * 0.5, h * 0.46
    max_r = math.hypot(w * 0.55, h * 0.55)
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            d = min(1.0, math.hypot((x - cx), (y - cy) * 1.2) / max_r)
            t = d * d
            r = int(center_rgb[0] * (1 - t) + edge_rgb[0] * t)
            g = int(center_rgb[1] * (1 - t) + edge_rgb[1] * t)
            b = int(center_rgb[2] * (1 - t) + edge_rgb[2] * t)
            a = int(255 * (center_alpha * (1 - t) + edge_alpha * t))
            px[x, y] = (r, g, b, a)
            if x + 1 < w:
                px[x + 1, y] = (r, g, b, a)
            if y + 1 < h:
                px[x, y + 1] = (r, g, b, a)
                if x + 1 < w:
                    px[x + 1, y + 1] = (r, g, b, a)
    return Image.alpha_composite(base, overlay)


def draw_cushion_rail(img: Image.Image, rail_rgb: tuple[int, int, int], brass_rgb: tuple[int, int, int]):
    w, h = img.size
    rail = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(rail)
    # Outer dark wooden/padded frame
    d.rectangle([(0, 0), (w - 1, h - 1)], outline=rail_rgb + (240,), width=28)
    # Inner brass inlay line
    d.rounded_rectangle([(32, 32), (w - 32, h - 32)], radius=36, outline=brass_rgb + (180,), width=4)
    d.rounded_rectangle([(42, 42), (w - 42, h - 42)], radius=30, outline=brass_rgb + (80,), width=2)
    return Image.alpha_composite(img, rail)


def build_backgrounds():
    w, h = 1600, 1000
    rng = random.Random(42)

    # 1. Trattoria (Warm Walnut Wood + Golden Tavern Glow + Corner Wine/Olive Accents)
    bg1 = tile_texture("walnut.webp", w, h)
    bg1 = apply_radial_lighting(bg1, (245, 165, 60), (22, 12, 6), 0.18, 0.85)
    bg1 = draw_cushion_rail(bg1, (45, 24, 12), (218, 165, 55))
    bg1.convert("RGB").save(os.path.join(BG_DIR, "trattoria.webp"), "WEBP", quality=88)

    # 2. Salotto (Classic Emerald Casino/Club Felt + Mahogany & Brass Rail)
    bg2 = tile_texture("felt.webp", w, h)
    bg2 = apply_radial_lighting(bg2, (22, 168, 102), (3, 36, 22), 0.22, 0.88)
    bg2 = draw_cushion_rail(bg2, (38, 18, 12), (235, 190, 75))
    bg2.convert("RGB").save(os.path.join(BG_DIR, "salotto.webp"), "WEBP", quality=88)

    # 3. Piazza (Venetian Carrara Marble + Warm Sunset Amber Vignette)
    bg3 = tile_texture("marble.webp", w, h)
    bg3 = apply_radial_lighting(bg3, (255, 228, 185), (32, 26, 24), 0.20, 0.86)
    bg3 = draw_cushion_rail(bg3, (52, 44, 40), (212, 175, 85))
    bg3.convert("RGB").save(os.path.join(BG_DIR, "piazza.webp"), "WEBP", quality=88)

    # 4. Notte Stellata (Midnight Indigo Linen + Golden Constellation Stars & Crescent Moon)
    bg4 = tile_texture("linen.webp", w, h)
    bg4 = apply_radial_lighting(bg4, (45, 95, 195), (6, 10, 26), 0.35, 0.92)
    star_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(star_layer)
    for _ in range(180):
        sx = rng.randint(50, w - 50)
        sy = rng.randint(50, h - 50)
        sr = rng.choice([1, 1, 2, 3])
        alpha = rng.randint(90, 230)
        sdraw.ellipse([(sx - sr, sy - sr), (sx + sr, sy + sr)], fill=(255, 245, 190, alpha))
    bg4 = Image.alpha_composite(bg4, star_layer)
    bg4 = draw_cushion_rail(bg4, (14, 22, 48), (185, 210, 255))
    bg4.convert("RGB").save(os.path.join(BG_DIR, "notte.webp"), "WEBP", quality=88)

    # 5. Halloween Stregato (Enchanted Twilight Purple + Glowing Pumpkin Lanterns & Stars)
    bg5 = tile_texture("linen.webp", w, h)
    bg5 = apply_radial_lighting(bg5, (235, 105, 20), (24, 8, 46), 0.32, 0.92)
    hal_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(hal_layer)
    # Draw subtle cobweb arcs in corners and glowing fireflies
    for cx, cy in [(45, 45), (w - 45, 45), (45, h - 45), (w - 45, h - 45)]:
        for r in range(40, 200, 35):
            hdraw.ellipse(
                [(cx - r, cy - r), (cx + r, cy + r)],
                outline=(255, 165, 60, 45),
                width=2,
            )
    for _ in range(90):
        fx = rng.randint(60, w - 60)
        fy = rng.randint(60, h - 60)
        fr = rng.randint(2, 5)
        hdraw.ellipse([(fx - fr, fy - fr), (fx + fr, fy + fr)], fill=(255, 155, 35, 140))
    hal_layer = hal_layer.filter(ImageFilter.GaussianBlur(1.5))
    bg5 = Image.alpha_composite(bg5, hal_layer)
    bg5 = draw_cushion_rail(bg5, (38, 12, 58), (249, 115, 22))
    bg5.convert("RGB").save(os.path.join(BG_DIR, "halloween.webp"), "WEBP", quality=88)

    # 6. Festa di Natale / Xmas (Deep Velvet Crimson & Pine Felt + Golden Snowflakes & Holly Border)
    bg6 = tile_texture("felt.webp", w, h)
    bg6 = apply_radial_lighting(bg6, (185, 28, 28), (14, 52, 28), 0.42, 0.90)
    xmas_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    xdraw = ImageDraw.Draw(xmas_layer)
    for _ in range(140):
        nx = rng.randint(50, w - 50)
        ny = rng.randint(50, h - 50)
        nr = rng.choice([2, 3, 4])
        xdraw.ellipse([(nx - nr, ny - nr), (nx + nr, ny + nr)], fill=(255, 250, 230, 150))
        if nr == 4:
            xdraw.line([(nx - 7, ny), (nx + 7, ny)], fill=(255, 240, 180, 160), width=1)
            xdraw.line([(nx, ny - 7), (nx, ny + 7)], fill=(255, 240, 180, 160), width=1)
    bg6 = Image.alpha_composite(bg6, xmas_layer)
    bg6 = draw_cushion_rail(bg6, (95, 16, 20), (250, 204, 21))
    bg6.convert("RGB").save(os.path.join(BG_DIR, "xmas.webp"), "WEBP", quality=88)

    # 7. Regno dei Bimbi (Cheerful Teal/Sky Meadow + Soft Rainbow Confetti Stars)
    bg7 = tile_texture("felt.webp", w, h)
    bg7 = apply_radial_lighting(bg7, (56, 189, 248), (13, 92, 82), 0.38, 0.85)
    kids_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    kdraw = ImageDraw.Draw(kids_layer)
    palette = [
        (253, 224, 71, 140),
        (244, 114, 182, 140),
        (74, 222, 128, 140),
        (96, 165, 250, 140),
        (251, 146, 60, 140),
    ]
    for _ in range(110):
        kx = rng.randint(60, w - 60)
        ky = rng.randint(60, h - 60)
        kr = rng.randint(4, 10)
        col = rng.choice(palette)
        kdraw.ellipse([(kx - kr, ky - kr), (kx + kr, ky + kr)], fill=col)
    bg7 = Image.alpha_composite(bg7, kids_layer)
    bg7 = draw_cushion_rail(bg7, (14, 116, 144), (253, 224, 71))
    bg7.convert("RGB").save(os.path.join(BG_DIR, "bimbi.webp"), "WEBP", quality=88)

    print(f"Built 7 scenic background images in {BG_DIR}")


if __name__ == "__main__":
    build_app_icon()
    build_backgrounds()
