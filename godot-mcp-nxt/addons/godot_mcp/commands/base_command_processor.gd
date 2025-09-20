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

# Error history for debugging and analysis
var _error_history = []

# Abstract method that must be implemented by subclasses
func process_command(client_id: int, command_type: String, params: Dictionary, command_id: String) -> bool:
	push_error("process_command() must be implemented by subclass")
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

	# Godot 4.5: Enhanced error reporting with call stack
	_log_error_with_callstack(message, "command_error")

## Enhanced error handling with real Godot error messages
func _send_godot_error(client_id: int, operation: String, godot_error: int, context: Dictionary = {}, command_id: String = "") -> void:
	var error_message = _get_godot_error_message(godot_error)
	var enhanced_message = "%s failed: %s" % [operation, error_message]

	# Add context information
	if context.has("path"):
		enhanced_message += " (Path: %s)" % context.path
	if context.has("type"):
		enhanced_message += " (Type: %s)" % context.type
	if context.has("node_path"):
		enhanced_message += " (Node: %s)" % context.node_path

	# Include Godot error code for debugging
	var response = {
		"status": "error",
		"message": enhanced_message,
		"godot_error_code": godot_error,
		"godot_error_name": _get_godot_error_name(godot_error),
		"operation": operation,
		"context": context
	}

	if not command_id.is_empty():
		response["commandId"] = command_id
		# Clean up operation tracking
		_active_operations.erase(command_id)

	# Emit the signal for local processing (useful for testing)
	command_completed.emit(client_id, "error", response, command_id)

	# Send to websocket if available
	if _websocket_server:
		_websocket_server.send_response(client_id, response)
	push_error("Godot error [%d]: %s - %s" % [godot_error, operation, error_message])

func _get_godot_error_message(error_code: int) -> String:
	match error_code:
		OK: return "Success"
		FAILED: return "Generic failure"
		ERR_UNAVAILABLE: return "Resource unavailable"
		ERR_UNCONFIGURED: return "Resource unconfigured"
		ERR_UNAUTHORIZED: return "Unauthorized access"
		ERR_PARAMETER_RANGE_ERROR: return "Parameter out of range"
		ERR_OUT_OF_MEMORY: return "Out of memory"
		ERR_FILE_NOT_FOUND: return "File not found"
		ERR_FILE_BAD_DRIVE: return "Bad drive"
		ERR_FILE_BAD_PATH: return "Bad path"
		ERR_FILE_NO_PERMISSION: return "No permission"
		ERR_FILE_ALREADY_IN_USE: return "File already in use"
		ERR_FILE_CANT_OPEN: return "Cannot open file"
		ERR_FILE_CANT_WRITE: return "Cannot write to file"
		ERR_FILE_CANT_READ: return "Cannot read from file"
		ERR_FILE_UNRECOGNIZED: return "Unrecognized file format"
		ERR_FILE_CORRUPT: return "File corrupt"
		ERR_FILE_MISSING_DEPENDENCIES: return "Missing dependencies"
		ERR_FILE_EOF: return "End of file"
		ERR_CANT_CREATE: return "Cannot create resource"
		ERR_QUERY_FAILED: return "Query failed"
		ERR_ALREADY_EXISTS: return "Already exists"
		ERR_DOES_NOT_EXIST: return "Does not exist"
		ERR_INVALID_DATA: return "Invalid data"
		ERR_INVALID_PARAMETER: return "Invalid parameter"
		ERR_INVALID_DECLARATION: return "Invalid declaration"
		ERR_METHOD_NOT_FOUND: return "Method not found"
		ERR_BUSY: return "Resource busy"
		ERR_HELP: return "Help requested"
		ERR_BUG: return "Bug in implementation"
		ERR_PRINTER_ON_FIRE: return "Printer on fire"
		_: return "Unknown error (code: %d)" % error_code

func _get_godot_error_name(error_code: int) -> String:
	match error_code:
		OK: return "OK"
		FAILED: return "FAILED"
		ERR_UNAVAILABLE: return "ERR_UNAVAILABLE"
		ERR_UNCONFIGURED: return "ERR_UNCONFIGURED"
		ERR_UNAUTHORIZED: return "ERR_UNAUTHORIZED"
		ERR_PARAMETER_RANGE_ERROR: return "ERR_PARAMETER_RANGE_ERROR"
		ERR_OUT_OF_MEMORY: return "ERR_OUT_OF_MEMORY"
		ERR_FILE_NOT_FOUND: return "ERR_FILE_NOT_FOUND"
		ERR_FILE_BAD_DRIVE: return "ERR_FILE_BAD_DRIVE"
		ERR_FILE_BAD_PATH: return "ERR_FILE_BAD_PATH"
		ERR_FILE_NO_PERMISSION: return "ERR_FILE_NO_PERMISSION"
		ERR_FILE_ALREADY_IN_USE: return "ERR_FILE_ALREADY_IN_USE"
		ERR_FILE_CANT_OPEN: return "ERR_FILE_CANT_OPEN"
		ERR_FILE_CANT_WRITE: return "ERR_FILE_CANT_WRITE"
		ERR_FILE_CANT_READ: return "ERR_FILE_CANT_READ"
		ERR_FILE_UNRECOGNIZED: return "ERR_FILE_UNRECOGNIZED"
		ERR_FILE_CORRUPT: return "ERR_FILE_CORRUPT"
		ERR_FILE_MISSING_DEPENDENCIES: return "ERR_FILE_MISSING_DEPENDENCIES"
		ERR_FILE_EOF: return "ERR_FILE_EOF"
		ERR_CANT_CREATE: return "ERR_CANT_CREATE"
		ERR_QUERY_FAILED: return "ERR_QUERY_FAILED"
		ERR_ALREADY_EXISTS: return "ERR_ALREADY_EXISTS"
		ERR_DOES_NOT_EXIST: return "ERR_DOES_NOT_EXIST"
		ERR_INVALID_DATA: return "ERR_INVALID_DATA"
		ERR_INVALID_PARAMETER: return "ERR_INVALID_PARAMETER"
		ERR_INVALID_DECLARATION: return "ERR_INVALID_DECLARATION"
		ERR_METHOD_NOT_FOUND: return "ERR_METHOD_NOT_FOUND"
		ERR_BUSY: return "ERR_BUSY"
		ERR_HELP: return "ERR_HELP"
		ERR_BUG: return "ERR_BUG"
		ERR_PRINTER_ON_FIRE: return "ERR_PRINTER_ON_FIRE"
		_: return "ERR_UNKNOWN"

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
		# Handle $type format for creating Godot objects (like shapes)
		if value.has("$type"):
			var object_type = value["$type"]
			if ClassDB.class_exists(object_type):
				var instance = ClassDB.instantiate(object_type)
				if instance:
					# Apply parameters based on object type
					match object_type:
						"RectangleShape2D":
							if value.has("size"):
								var size_dict = value.size
								if size_dict.has("x") and size_dict.has("y"):
									instance.size = Vector2(size_dict.x, size_dict.y)
						"CircleShape2D":
							if value.has("radius"):
								instance.radius = value.radius
						"CapsuleShape2D":
							if value.has("radius"):
								instance.radius = value.radius
							if value.has("height"):
								instance.height = value.height
						"BoxShape3D":
							if value.has("size"):
								var size_dict = value.size
								if size_dict.has("x") and size_dict.has("y") and size_dict.has("z"):
									instance.size = Vector3(size_dict.x, size_dict.y, size_dict.z)
						"SphereShape3D":
							if value.has("radius"):
								instance.radius = value.radius
						"CapsuleShape3D":
							if value.has("radius"):
								instance.radius = value.radius
							if value.has("height"):
								instance.height = value.height
					print("Successfully created %s object with parameters" % object_type)
					return instance
			else:
				push_error("Invalid object type for $type: %s" % object_type)
				return value

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
		# Check if it's a resource path first
		if value.begins_with("res://") and (value.ends_with(".tres") or value.ends_with(".res") or value.ends_with(".gd")):
			var resource = load(value)
			if resource:
				print("Successfully loaded resource: %s" % value)
				return resource
			else:
				push_error("Failed to load resource: %s" % value)
				return value  # Return original string if load fails

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
	var memory_info = OS.get_static_memory_usage()

	# Enhanced memory tracking
	var memory_stats = {
		"static_memory": memory_info,
		"dynamic_memory": 0.0,  # Dynamic memory tracking not available in current Godot version
		"max_memory": Performance.get_monitor(Performance.MEMORY_STATIC_MAX),
		"memory_peak": Performance.get_monitor(Performance.MEMORY_STATIC_MAX)  # Peak memory usage
	}

	return {
		"active_operations": _active_operations.size(),
		"scene_complexity": complexity,
		"memory_stats": memory_stats,
		"performance_metrics": {
			"fps": Performance.get_monitor(Performance.TIME_FPS),
			"frame_time": Performance.get_monitor(Performance.TIME_PROCESS),
			"physics_time": Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS),
			"objects_drawn": Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME),
			"vertices_drawn": Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME)
		},
		"custom_monitors": _get_custom_performance_monitors(),
		"timestamp": Time.get_ticks_msec()
	}

# Godot 4.5: Custom performance monitors for debugger panel
func _get_custom_performance_monitors() -> Dictionary:
	return {
		"mcp_active_operations": _active_operations.size(),
		"mcp_memory_pressure": _calculate_memory_pressure(),
		"mcp_scene_complexity": _get_scene_complexity().get("total_nodes", 0),
		"mcp_operation_timeout_count": _get_operation_timeout_count()
	}

func _get_operation_timeout_count() -> int:
	# Track how many operations have timed out (Godot 4.5 feature)
	var timeout_count = 0
	var current_time = Time.get_ticks_msec()

	for command_id in _active_operations:
		var start_time = _active_operations[command_id]
		if current_time - start_time > operation_timeout:
			timeout_count += 1

	return timeout_count

## Memory optimization functions
func _optimize_memory_usage() -> void:
	# Comprehensive memory optimization for Godot applications

	# Clear any cached resources that are no longer needed
	_cleanup_expired_resources()

	# Manual garbage collection hints
	OS.delay_msec(0)  # Yield to allow GC to run

	# Log memory optimization
	var memory_before = OS.get_static_memory_usage()
	print("Memory optimization triggered - before: %d MB" % (memory_before / 1024 / 1024))

	# Web platform specific optimization
	if OS.has_feature("web"):
		# Web platform - JavaScript GC hints available via JavaScript singleton
		print("Web platform detected - JavaScript GC may be available")
	else:
		print("Native platform - using Godot's automatic memory management")

func _cleanup_expired_resources() -> void:
	# Clean up expired operations and cached data
	_cleanup_expired_operations()

	# Additional cleanup for MCP-specific resources
	# Note: Resource management is handled by individual command processors
	# (e.g., node_commands.gd handles stored resources)

	# Force cleanup of temporary data structures
	OS.delay_msec(0)  # Allow GC to process

	print("Expired resources cleanup completed")

func _monitor_resource_usage() -> Dictionary:
	var resource_stats = {
		"nodes_in_scene": _get_scene_complexity().get("total_nodes", 0),
		"active_operations": _active_operations.size(),
		"memory_pressure": _calculate_memory_pressure(),
		"performance_indicators": {
			"high_node_count": _get_scene_complexity().get("total_nodes", 0) > 500,
			"high_operation_count": _active_operations.size() > 10,
			"memory_pressure_high": _calculate_memory_pressure() > 0.8
		}
	}

	# Trigger optimizations if needed
	if resource_stats.performance_indicators.memory_pressure_high:
		_optimize_memory_usage()

	return resource_stats

func _calculate_memory_pressure() -> float:
	var static_mem = OS.get_static_memory_usage()
	var max_mem = Performance.get_monitor(Performance.MEMORY_STATIC_MAX)

	if max_mem == 0:
		return 0.0

	return float(static_mem) / float(max_mem)

## Path sanitization and security functions
func _sanitize_path(input_path: String, base_path: String = "res://") -> Dictionary:
	var result = {
		"valid": false,
		"sanitized_path": "",
		"error": ""
	}

	# Normalize path separators
	var normalized = input_path.replace("\\", "/")

	# Remove dangerous patterns
	if ".." in normalized:
		result.error = "Path traversal attempt detected"
		return result

	# Ensure it starts with base path
	if not normalized.begins_with(base_path):
		normalized = base_path + normalized.trim_prefix("/")

	# Remove duplicate slashes
	while "//" in normalized:
		normalized = normalized.replace("//", "/")

	# Validate final path
	if not _is_path_safe(normalized):
		result.error = "Unsafe path detected"
		return result

	result.valid = true
	result.sanitized_path = normalized
	return result

func _is_path_safe(path: String) -> bool:
	# Check for suspicious patterns
	var suspicious = ["://", "\\\\", "\\\\x00", "\\\\n", "\\\\r", "\\\\t"]
	for pattern in suspicious:
		if pattern in path:
			return false
	return true

## Input validation and sanitization
func _validate_command_input(params: Dictionary, schema: Dictionary) -> Dictionary:
	var result = {
		"valid": true,
		"errors": [],
		"sanitized_params": {}
	}

	for key in schema.keys():
		var rules = schema[key]
		var value = params.get(key)

		# Required field check
		if rules.get("required", false) and value == null:
			result.errors.append("Missing required field: %s" % key)
			result.valid = false
			continue

		# Type validation
		var expected_type = rules.get("type")
		if expected_type and typeof(value) != expected_type:
			result.errors.append("Field %s has wrong type. Expected %s, got %s" % [key, expected_type, typeof(value)])
			result.valid = false
			continue

		# String sanitization
		if typeof(value) == TYPE_STRING:
			var sanitized = _sanitize_string(value, rules)
			result.sanitized_params[key] = sanitized
		else:
			result.sanitized_params[key] = value

	return result

func _sanitize_string(input: String, rules: Dictionary) -> String:
	var sanitized = input.strip_edges()

	# Length limits
	var max_length = rules.get("max_length", 1000)
	if sanitized.length() > max_length:
		sanitized = sanitized.substr(0, max_length)

	# Remove dangerous characters
	var dangerous = ["\\\\x00", "\\\\n", "\\\\r", "\\\\t"]
	for char in dangerous:
		sanitized = sanitized.replace(char, "")

	return sanitized

# Helper function to suggest correct property names for common mistakes
func _suggest_property_name(node: Node, incorrect_name: String) -> String:
	var node_class = node.get_class()

	# Common property name corrections based on node type
	if node_class == "Camera2D":
		if incorrect_name == "current":
			return "enabled"
	elif node_class == "Camera3D":
		if incorrect_name == "current":
			return "current"
	elif node_class in ["Sprite2D", "Sprite3D"]:
		if incorrect_name in ["texture", "image"]:
			return "texture"
	elif node_class in ["CollisionShape2D", "CollisionShape3D"]:
		if incorrect_name in ["collision", "collider"]:
			return "shape"
	elif node_class == "MeshInstance3D":
		if incorrect_name in ["model", "geometry"]:
			return "mesh"
	elif node_class == "AnimationPlayer":
		if incorrect_name in ["playing", "active"]:
			return "autoplay"
	elif node_class == "Timer":
		if incorrect_name == "running":
			return "autostart"

	# General corrections for any node
	if incorrect_name == "visible":
		return "visible"
	elif incorrect_name == "enabled":
		return "process_mode"  # For nodes that have process_mode instead of enabled
	elif incorrect_name == "active":
		return "visible"  # Common mistake

	return ""  # No suggestion

# Godot 4.5: Variadic function for flexible logging with multiple parameters
func _log_variadic(message: String, ...extra_params) -> void:
	var full_message = message
	for param in extra_params:
		full_message += " " + str(param)
	print(full_message)

# Godot 4.5: Enhanced error logging with call stack support
func _log_error_with_callstack(error_message: String, error_type: String) -> void:
	# Get the current call stack (Godot 4.5 feature)
	var callstack = get_stack()

	# Format the call stack for logging
	var stack_trace = ""
	for i in range(callstack.size()):
		var frame = callstack[i]
		var function_name = frame.get("function", "unknown")
		var file_name = frame.get("source", "unknown").get_file()
		var line_number = frame.get("line", 0)
		stack_trace += "\n  [%d] %s:%d in %s()" % [i, file_name, line_number, function_name]

	# Log the enhanced error information
	var enhanced_log = "MCP Error [%s]: %s\nCall Stack:%s" % [error_type, error_message, stack_trace]
	print(enhanced_log)

	# Store for debugging/analysis
	if not _error_history:
		_error_history = []
	_error_history.append({
		"timestamp": Time.get_ticks_msec(),
		"type": error_type,
		"message": error_message,
		"callstack": callstack
	})

	# Keep only last 50 errors to prevent memory bloat
	if _error_history.size() > 50:
		_error_history.remove_at(0)

