@tool
class_name MCPBaseCommandProcessor
extends Node

# Signal emitted when a command has completed processing
signal command_completed(client_id, command_type, result, command_id)

# Reference to the server - passed by the command handler
var _websocket_server = null

# Operation timeout settings (in milliseconds)
var operation_timeout = 30000 # 30 seconds for complex operations
var _active_operations = {} # Track active operations with timestamps

# Must be implemented by subclasses
func process_command(client_id: int, command_type: String, params: Dictionary, command_id: String) -> bool:
	push_error("BaseCommandProcessor.process_command called directly")
	return false

# Helper functions common to all command processors
func _send_success(client_id: int, result: Dictionary, command_id: String) -> void:
	var response = {
		"status": "success",
		"result": result
	}

	if not command_id.is_empty():
		response["commandId"] = command_id
		# Clean up operation tracking
		_active_operations.erase(command_id)

	# Emit the signal for local processing (useful for testing)
	command_completed.emit(client_id, "success", result, command_id)

	# Send to websocket if available
	if _websocket_server:
		_websocket_server.send_response(client_id, response)

func _send_error(client_id: int, message: String, command_id: String) -> void:
	var response = {
		"status": "error",
		"message": message
	}

	if not command_id.is_empty():
		response["commandId"] = command_id
		# Clean up operation tracking
		_active_operations.erase(command_id)

	# Emit the signal for local processing (useful for testing)
	var error_result = {"error": message}
	command_completed.emit(client_id, "error", error_result, command_id)

	# Send to websocket if available
	if _websocket_server:
		_websocket_server.send_response(client_id, response)
	push_error("Command error: %s" % message)

# Common utility methods
func _get_editor_node(path: String) -> Node:
	var plugin = Engine.get_meta("GodotMCPPlugin")
	if not plugin:
		push_error("GodotMCPPlugin not found in Engine metadata")
		return null

	var editor_interface = plugin.get_editor_interface()
	var edited_scene_root = editor_interface.get_edited_scene_root()

	if not edited_scene_root:
		push_error("No edited scene found - make sure a scene is open in the editor")
		return null

	# Handle absolute paths
	if path == "/root" or path == "":
		return edited_scene_root

	# Handle paths that reference the scene root by name (e.g., "/root/SceneName")
	if path.begins_with("/root/"):
		var remaining_path = path.substr(6)  # Remove "/root/"
		# If the remaining path matches the scene root name, return the scene root
		if remaining_path == edited_scene_root.name:
			return edited_scene_root
		# Otherwise, look for the node as a child of the scene root
		var node = edited_scene_root.get_node_or_null(remaining_path)
		if not node:
			push_error("Node not found at path: %s (searched in scene root: %s)" % [remaining_path, edited_scene_root.name])
		return node

	# Handle relative paths from scene root
	if path.begins_with("/"):
		path = path.substr(1)  # Remove leading "/"

	# Try to find node as child of edited scene root
	var node = edited_scene_root.get_node_or_null(path)
	if not node:
		push_error("Node not found at path: %s (relative to scene root: %s)" % [path, edited_scene_root.name])
	return node

# Helper function to mark a scene as modified
func _mark_scene_modified() -> void:
	var plugin = Engine.get_meta("GodotMCPPlugin")
	if not plugin:
		push_error("GodotMCPPlugin not found in Engine metadata")
		return

	var editor_interface = plugin.get_editor_interface()
	var edited_scene_root = editor_interface.get_edited_scene_root()

	if edited_scene_root:
		# This internally marks the scene as modified in the editor
		editor_interface.mark_scene_as_unsaved()
		print("Scene marked as modified")
	else:
		push_warning("Could not mark scene as modified - no edited scene root found")

# Helper function to validate node path format
func _validate_node_path(path: String) -> bool:
	if path.is_empty():
		return false

	# Basic validation - should start with / or be relative
	if not path.begins_with("/") and not path.is_empty():
		# Allow relative paths
		pass

	# Check for invalid characters
	var invalid_chars = ["\\", ":", "*", "?", "\"", "<", ">", "|"]
	for char in invalid_chars:
		if char in path:
			push_error("Invalid character '%s' in node path: %s" % [char, path])
			return false

	return true

# Helper function to get scene complexity metrics
func _get_scene_complexity() -> Dictionary:
	var plugin = Engine.get_meta("GodotMCPPlugin")
	if not plugin:
		return {"error": "Plugin not found"}

	var editor_interface = plugin.get_editor_interface()
	var edited_scene_root = editor_interface.get_edited_scene_root()

	if not edited_scene_root:
		return {"error": "No scene open"}

	var node_count = 0
	var max_depth = 0

	_count_nodes_recursive(edited_scene_root, 0, node_count, max_depth)

	return {
		"total_nodes": node_count,
		"max_depth": max_depth,
		"scene_name": edited_scene_root.name,
		"scene_type": edited_scene_root.get_class()
	}

# Recursive helper function for counting nodes
func _count_nodes_recursive(node: Node, depth: int, node_count: int, max_depth: int) -> void:
	node_count += 1
	max_depth = max(max_depth, depth)
	for child in node.get_children():
		_count_nodes_recursive(child, depth + 1, node_count, max_depth)

# Helper function to access the EditorUndoRedoManager
func _get_undo_redo():
	var plugin = Engine.get_meta("GodotMCPPlugin")
	if not plugin or not plugin.has_method("get_undo_redo"):
		print("Cannot access UndoRedo from plugin")
		return null
		
	return plugin.get_undo_redo()

# Helper function to parse property values from various formats to proper Godot types
func _parse_property_value(value):
	var value_type = typeof(value)

	# Handle Dictionary types (like Vector2, Color, etc.)
	if value_type == TYPE_DICTIONARY:
		# Handle Vector2 format: {"x": 100, "y": 200}
		if value.has("x") and value.has("y"):
			if value.has("z"):
				# Vector3
				return Vector3(value.x, value.y, value.z)
			else:
				# Vector2
				return Vector2(value.x, value.y)

		# Handle Color format: {"r": 1.0, "g": 0.5, "b": 0.0, "a": 1.0}
		if value.has("r") and value.has("g") and value.has("b"):
			var a = value.get("a", 1.0)
			return Color(value.r, value.g, value.b, a)

		# Handle Rect2 format: {"x": 0, "y": 0, "width": 100, "height": 100}
		if value.has("width") and value.has("height"):
			var x = value.get("x", 0)
			var y = value.get("y", 0)
			return Rect2(x, y, value.width, value.height)

	# Handle string representations of Godot types
	if value_type == TYPE_STRING:
		# Try to parse common Godot type strings
		var expression = Expression.new()
		var error = expression.parse(value, [])

		if error == OK:
			var result = expression.execute([], null, true)
			if not expression.has_execute_failed():
				print("Successfully parsed %s as %s" % [value, result])
				return result
			else:
				print("Failed to execute expression for: %s" % value)
		else:
			print("Failed to parse expression: %s (Error: %d)" % [value, error])

	# Handle numeric values that might need conversion
	if value_type == TYPE_FLOAT:
		# Convert float to int if it appears to be a whole number
		if value == floor(value):
			return int(value)

	# Return value as-is for other types
	return value

# Operation timeout management
func _start_operation(command_id: String) -> void:
	if not command_id.is_empty():
		_active_operations[command_id] = Time.get_ticks_msec()

func _check_operation_timeout(command_id: String) -> bool:
	if command_id.is_empty() or not _active_operations.has(command_id):
		return false

	var start_time = _active_operations[command_id]
	var current_time = Time.get_ticks_msec()

	if current_time - start_time > operation_timeout:
		_active_operations.erase(command_id)
		push_error("Operation %s timed out after %d ms" % [command_id, operation_timeout])
		return true

	return false

func _cleanup_expired_operations() -> void:
	var current_time = Time.get_ticks_msec()
	var to_remove = []

	for command_id in _active_operations:
		var start_time = _active_operations[command_id]
		if current_time - start_time > operation_timeout:
			to_remove.append(command_id)

	for command_id in to_remove:
		_active_operations.erase(command_id)
		push_warning("Cleaned up expired operation: %s" % command_id)

# Get performance metrics for monitoring
func _get_internal_performance_metrics() -> Dictionary:
	var complexity = _get_scene_complexity()
	return {
		"active_operations": _active_operations.size(),
		"scene_complexity": complexity,
		"memory_usage": OS.get_static_memory_usage(),
		"timestamp": Time.get_ticks_msec()
	}
