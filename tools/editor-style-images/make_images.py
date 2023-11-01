from PIL import Image

sample_flat_code = """\
import pytch
import random

class ScoreKeeper(pytch.Sprite):
    Costumes = ["Dani.png"]

    @pytch.when_green_flag_clicked
    def initialise(self):
        self.go_to_xy(-215, -115)
        self.score = 0
        self.say(self.score)

    @pytch.when_I_receive("award-point")
    def award_point(self):
        self.score += 1
        self.say(self.score)

    @pytch.when_green_flag_clicked
    def drop_apples(self):
        while True:
            pytch.broadcast_and_wait("drop-apple")

class Bowl(pytch.Sprite):
    Costumes = ["bowl.png"]

    # There would_be_more_code here really
"""

sample_per_method = ["""\
self.go_to_xy(215, 0)
self.switch_costume("robot-normal.png")

while True:
    target_y = Ball.the_original().y_position
    if target_y < -117:
        target_y = -117
    self.set_y(target_y)
""", """\
self.switch_costume("robot-flash.png")
pytch.wait_seconds(0.1)
self.switch_costume("robot-normal.png")
""", """\
self.go_to_xy(0, 0)

x_speed = 3
y_speed = 0
"""]

thumbnail_size = (512, 360)

charbox_wd = 9
charbox_ht = 9
charbox_size = (charbox_wd, charbox_ht)
charbox_colour = (144,) * 3
flat_leading = 3
charbox_vstride = charbox_ht + flat_leading

flat_left_margin = 24
flat_top_margin = 24
inter_script_gap = 12

im_char = Image.new("RGB", charbox_size, charbox_colour)
im_bump = Image.open("hat-block-bump-18h.png")
bump_ht = im_bump.size[1]
im_hat_block = Image.new("RGB", (464, 18), (240, 180, 0))
im_bump_excess = im_bump.size[1] - im_hat_block.size[1]

def paste_text_blocks(im, lines, offset_x, offset_y):
    for (row, line) in enumerate(lines):
        line = line.rstrip()
        for (col, ch) in enumerate(line):
            prev_ch = " " if col == 0 else line[col - 1]
            next_ch = " " if col == len(line) - 1 else line[col + 1]
            if ch != " ":
                x0 = offset_x + col * charbox_wd
                x1 = x0 + charbox_wd - 1
                y0 = offset_y + row * charbox_vstride
                y1 = y0 + charbox_ht - 1
                if y0 < im.size[1]:
                    px = im.load()
                    im_bg = px[x0, y0]
                    im.paste(im_char, (x0, y0))
                    if prev_ch == " ":
                        px[x0, y0] = im_bg
                        px[x0, y1] = im_bg
                    if next_ch == " ":
                        px[x1, y0] = im_bg
                        px[x1, y1] = im_bg

def mk_flat_image():
    im = Image.new("RGB", thumbnail_size, (255, 255, 255))
    paste_text_blocks(
        im,
        sample_flat_code.split("\n"),
        flat_left_margin,
        flat_top_margin
    )
    im.save("flat.png")

def use_chunk(chunk):
    for prefix in ["def ", "if ", "    "]:
        if chunk[0].startswith(prefix):
            return True
    return False

def mk_per_method_image():
    im = Image.new("RGB", thumbnail_size, (244, 244, 255))
    curs_y = flat_top_margin

    for chunk_text in sample_per_method:
        chunk = [
            line.rstrip()
            for line in chunk_text.rstrip().split("\n")
        ]
        n_lines = len(chunk)

        im.paste(im_bump, (flat_left_margin, curs_y))
        curs_y += im_bump_excess

        im.paste(im_hat_block, (flat_left_margin, curs_y))
        curs_y += im_hat_block.size[1]

        ace_size = (
            im_hat_block.size[0],
            n_lines * charbox_vstride + charbox_ht
        )
        im_ace = Image.new("RGB", ace_size, (255, 255, 255))
        im.paste(im_ace, (flat_left_margin, curs_y))
        paste_text_blocks(
            im,
            chunk,
            flat_left_margin + 4,
            curs_y + charbox_vstride // 2
        )
        curs_y += inter_script_gap + charbox_vstride * (n_lines + 1)

    im.save("per-method.png")

if __name__ == "__main__":
    mk_flat_image()
    mk_per_method_image()
