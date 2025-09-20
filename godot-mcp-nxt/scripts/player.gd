extends CharacterBody2D

@export var speed: float = 300.0
@export var jump_velocity: float = -400.0

func _ready():
	pass

func _physics_process(delta):
	# Handle movement
	var direction = Input.get_axis("ui_left", "ui_right")
	if direction:
		velocity.x = direction * speed
	else:
		velocity.x = move_toward(velocity.x, 0, speed)

	# Handle jumping
	if Input.is_action_just_pressed("ui_accept") and is_on_floor():
		velocity.y = jump_velocity

	move_and_slide()
