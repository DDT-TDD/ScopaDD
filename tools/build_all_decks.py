import os
import shutil
from PIL import Image

def build_napoletane():
    src_dir = 'Reference/scopa-master1/public/cards/napoletane'
    out_dir = 'public/cards/napoletane'
    os.makedirs(out_dir, exist_ok=True)
    for f in os.listdir(src_dir):
        if f.endswith('.webp'):
            shutil.copy2(os.path.join(src_dir, f), os.path.join(out_dir, f))
    print('Built napoletane: 40 cards + back.webp')

def build_bergamasche():
    src_base = 'Reference/scopa-master2/src/ui/assets/bergamo'
    out_dir = 'public/cards/bergamasche'
    os.makedirs(out_dir, exist_ok=True)
    suits = ['denari', 'coppe', 'spade', 'bastoni']
    for s_idx, suit in enumerate(suits):
        for rank in range(1, 11):
            card_id = s_idx * 10 + (rank - 1)
            pad = f'{card_id:02d}'
            src_file = os.path.join(src_base, suit, f'{rank}.jpg')
            out_file = os.path.join(out_dir, f'{pad}.webp')
            im = Image.open(src_file).convert('RGB')
            im.save(out_file, 'WEBP', quality=92, method=6)
    print('Built bergamasche: 40 cards')

def build_triestine():
    src_base = 'Reference/briscola-master/public/images'
    out_dir = 'public/cards/triestine'
    os.makedirs(out_dir, exist_ok=True)
    suits = ['Coins', 'Cups', 'Swords', 'Batons']
    ranks = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'knave', 'knight', 'king']
    for s_idx, suit in enumerate(suits):
        for r_idx, rank in enumerate(ranks):
            card_id = s_idx * 10 + r_idx
            pad = f'{card_id:02d}'
            src_file = os.path.join(src_base, f'{rank}Of{suit}.png')
            out_file = os.path.join(out_dir, f'{pad}.webp')
            im = Image.open(src_file)
            # Composite onto clean white background if RGBA
            bg = Image.new('RGB', im.size, (255, 255, 255))
            if im.mode == 'RGBA':
                bg.paste(im, mask=im.split()[3])
            else:
                bg.paste(im.convert('RGB'))
            bg.save(out_file, 'WEBP', quality=92, method=6)
    # Also save backside.png as back.webp
    back_src = os.path.join(src_base, 'backside.png')
    if os.path.exists(back_src):
        im_b = Image.open(back_src)
        bg_b = Image.new('RGB', im_b.size, (255, 255, 255))
        if im_b.mode == 'RGBA':
            bg_b.paste(im_b, mask=im_b.split()[3])
        else:
            bg_b.paste(im_b.convert('RGB'))
        bg_b.save(os.path.join(out_dir, 'back.webp'), 'WEBP', quality=92, method=6)
    print('Built triestine: 40 cards + back.webp')

def build_piacentine():
    src_base = 'Reference/briscola-main/src/assets/cards'
    out_dir = 'public/cards/piacentine'
    os.makedirs(out_dir, exist_ok=True)
    suits = ['denari', 'coppe', 'spade', 'bastoni']
    ranks = ['asso', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'fante', 'cavallo', 're']
    for s_idx, suit in enumerate(suits):
        for r_idx, rank in enumerate(ranks):
            card_id = s_idx * 10 + r_idx
            pad = f'{card_id:02d}'
            src_file = os.path.join(src_base, f'{suit}-{rank}.webp')
            out_file = os.path.join(out_dir, f'{pad}.webp')
            shutil.copy2(src_file, out_file)
    back_svg = os.path.join(src_base, 'back.svg')
    if os.path.exists(back_svg):
        shutil.copy2(back_svg, os.path.join(out_dir, 'back.svg'))
    print('Built piacentine from Reference/briscola-main: 40 cards + back.svg')

if __name__ == '__main__':
    build_napoletane()
    build_piacentine()
    build_bergamasche()
    build_triestine()
    print('All 4 regional raster decks successfully built!')
