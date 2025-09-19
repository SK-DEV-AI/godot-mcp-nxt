extends Sprite2D

func _ready():
	print("Test sprite is ready!")
	modulate = Color.RED

func _process(delta):
	rotation += delta * 2.0
