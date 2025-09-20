extends Node

func _ready():
	# Assign player collision shape
	var player_collision = $"../Player/CollisionShape2D"
	var player_shape = RectangleShape2D.new()
	player_shape.size = Vector2(32, 32)
	player_collision.shape = player_shape
	
	# Assign platform collision shapes
	for i in range(1, 4):
		var platform_collision = get_node("../Platform" + str(i) + "/CollisionShape2D")
		var platform_shape = RectangleShape2D.new()
		if i == 1:
			platform_shape.size = Vector2(200, 20)
		elif i == 2:
			platform_shape.size = Vector2(150, 20)
		else:
			platform_shape.size = Vector2(100, 20)
		platform_collision.shape = platform_shape
	
	print("All collision shapes assigned successfully!")
	
	# Remove this setup script after running
	queue_free()