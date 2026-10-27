import os
import glob
from PIL import Image
import numpy as np

CARDS_DIR = 'public/cards/piacentine'

# Frame definition for each card [left_x, top_y, right_x, bot_y]
# If None, automatically derived using suit profile
SUIT_PROFILES = {
    0: {'lx': 37, 'rx': 282, 'ty': 18, 'by': 501, 'court_ty': 12, 'court_by': 495}, # Denari
    1: {'lx': 39, 'rx': 276, 'ty': 36, 'by': 504, 'court_ty': 34, 'court_by': 501}, # Coppe
    2: {'lx': 40, 'rx': 280, 'ty': 38, 'by': 514, 'court_ty': 18, 'court_by': 495}, # Spade
    3: {'lx': 35, 'rx': 284, 'ty': 14, 'by': 504, 'court_ty': 10, 'court_by': 500}, # Bastoni
}

# Individual overrides for any card that was shifted on the sheet
OVERRIDES = {
    0:  (38, 20, 282, 504),
    7:  (37, 12, 282, 495),
    9:  (36, 12, 282, 495),
    10: (40, 38, 277, 506),
    11: (39, 34, 276, 502),
    12: (38, 38, 276, 506),
    13: (38, 37, 275, 505),
    14: (25, 37, 260, 505), # Card 14 was shifted 15px left in raw crop
    15: (39, 36, 276, 504),
    16: (39, 35, 275, 503),
    17: (40, 39, 277, 507),
    18: (34, 35, 271, 503), # Card 18 was shifted left
    19: (40, 31, 278, 499),
    20: (39, 38, 280, 514),
    21: (41, 28, 281, 504),
    22: (40, 40, 279, 517),
    23: (40, 39, 280, 516),
    24: (39, 40, 281, 517),
    25: (39, 39, 280, 516),
    26: (40, 34, 281, 511),
    27: (40, 32, 276, 495),
    28: (41, 21, 276, 498),
    29: (39, 13, 279, 490),
    30: (36, 14, 281, 506),
    31: (33, 10, 286, 502),
    32: (35, 16, 283, 508),
    33: (35,  6, 283, 498),
    37: (35,  7, 284, 499),
    38: (39, 25, 280, 501),
    39: (34, 10, 284, 501),
}

def clean_card(card_id):
    pad = f'{card_id:02d}'
    filepath = os.path.join(CARDS_DIR, f'{pad}.webp')
    if not os.path.exists(filepath):
        print(f'Missing {filepath}')
        return

    im = Image.open(filepath).convert('RGB')
    
    suit = card_id // 10
    rank = (card_id % 10) + 1 # 1..10
    
    if card_id in OVERRIDES:
        lx, ty, rx, by = OVERRIDES[card_id]
    else:
        prof = SUIT_PROFILES[suit]
        lx, rx = prof['lx'], prof['rx']
        if rank >= 8:
            ty, by = prof['court_ty'], prof['court_by']
        else:
            ty, by = prof['ty'], prof['by']

    # Crop the card artwork tightly around its frame
    crop = im.crop((lx, ty, rx, by))
    
    # Target standardized card size: 320 x 528
    TARGET_W = 320
    TARGET_H = 528
    
    clean_im = Image.new('RGB', (TARGET_W, TARGET_H), (255, 255, 255))
    
    # Calculate perfectly centered position
    paste_x = (TARGET_W - crop.width) // 2
    paste_y = (TARGET_H - crop.height) // 2
    
    clean_im.paste(crop, (paste_x, paste_y))
    
    # Save optimized WebP with lossless/high quality
    clean_im.save(filepath, 'WEBP', quality=95, method=6)
    print(f'Cleaned {pad}.webp: crop=({lx},{ty},{rx},{by}) size={crop.size} paste=({paste_x},{paste_y})')

def main():
    print('Recentering and cleaning all 40 Piacentine cards...')
    for c in range(40):
        clean_card(c)
    print('All 40 Piacentine cards cleanly recentered and perfected.')

if __name__ == '__main__':
    main()
