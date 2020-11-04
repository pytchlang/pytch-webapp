import pytch

# This line and everything below it reminds you how to set up Sprites
# and the code in them.  You can change or delete anything you don't
# need.  You can also delete the green-burst or python-logo images if
# you don't need them for your project.


class DoubleSnake(pytch.Sprite):
    Costumes = ["python-logo.png"]

    @pytch.when_this_sprite_clicked
    def say_hello(self):
        self.say_for_seconds("Hello!", 2.0)

    @pytch.when_key_pressed("ArrowLeft")
    def move_left(self):
        self.change_x(-10)

    @pytch.when_key_pressed("ArrowRight")
    def move_right(self):
        self.change_x(10)


class GreenBurst(pytch.Stage):
    Backdrops = ["green-burst.jpg"]
