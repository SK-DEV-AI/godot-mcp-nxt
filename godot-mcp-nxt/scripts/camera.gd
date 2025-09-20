extends Camera2D

@export var target: Node2D
@export var smooth_speed: float = 5.0

func _ready():
	if target == null:
		target = get_parent().get_node("Player")
	make_current()

func _process(delta):
	if target:
		global_position = global_position.lerp(target.global_position, smooth_speed * delta)
