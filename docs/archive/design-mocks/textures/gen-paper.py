#!/usr/bin/env python3
"""Generate probe paper textures (stdlib only). CC0-1.0 — see ATTRIBUTION.md."""
import math
import os
import random
import struct
import zlib

OUT_DIR = os.path.dirname(os.path.abspath(__file__))


def write_png(path, width, height, pixels):
    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)
        )

    raw = b""
    for y in range(height):
        raw += b"\x00"
        for x in range(width):
            raw += bytes(pixels[y * width + x])

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", ihdr))
        f.write(chunk(b"IDAT", zlib.compress(raw, 9)))
        f.write(chunk(b"IEND", b""))


def gen_paper(seed, width=512, height=512, warm=True):
    rnd = random.Random(seed)
    base = (235, 220, 195) if warm else (228, 224, 210)
    pixels = []
    for y in range(height):
        for x in range(width):
            w1 = math.sin((x * 0.018 + seed * 0.13) + math.sin(y * 0.011 + seed)) * 18
            w2 = math.sin((y * 0.022 + seed * 0.07) + math.cos(x * 0.009)) * 14
            n = rnd.uniform(-12, 12)
            stain = math.exp(
                -((x - width * 0.72) ** 2 + (y - height * 0.28) ** 2) / (width * 0.35) ** 2
            ) * 22
            edge = (
                max(abs(x - width / 2) / (width / 2), abs(y - height / 2) / (height / 2)) ** 2
            ) * 18
            r = int(max(0, min(255, base[0] - w1 - edge + n - stain * 0.3)))
            g = int(max(0, min(255, base[1] - w2 - edge * 0.8 + n - stain * 0.5)))
            b = int(max(0, min(255, base[2] - (w1 + w2) * 0.4 - edge * 0.5 + n - stain * 0.2)))
            pixels.append((r, g, b))
    return pixels


if __name__ == "__main__":
    write_png(
        os.path.join(OUT_DIR, "paper-aged-warm.png"),
        512,
        512,
        gen_paper(42),
    )
    write_png(
        os.path.join(OUT_DIR, "paper-aged-cream.png"),
        512,
        512,
        gen_paper(137, warm=False),
    )
    print("ok")
