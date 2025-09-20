@tool
class_name MCPCommandHandler
extends Node

var _websocket_server
var _command_processors = []
var _screenshot_manager = null
var _fuzzy_matcher = null

func _ready():
	MCPDebugManager.log_info("Command handler initializing...", "command_handler")
	await get_tree().process_frame
	_websocket_server = get_parent()
	MCPDebugManager.log_debug("WebSocket server reference set", "command_handler", {"server": _websocket_server})

	# Initialize command processors
	_initialize_command_processors()

	MCPDebugManager.log_info("Command handler initialized and ready to process commands", "command_handler", {
		"processor_count": _command_processors.size()
	})

func _initialize_command_processors():
	# Create and add all command processors
	var node_commands = MCPNodeCommands.new()
	var script_commands = MCPScriptCommands.new()
	var scene_commands = MCPSceneCommands.new()
	var project_commands = MCPProjectCommands.new()
	var editor_commands = MCPEditorCommands.new()
	var editor_script_commands = MCPEditorScriptCommands.new()
	var advanced_commands = MCPAdvancedCommands.new()

	# Set server reference for all processors
	node_commands._websocket_server = _websocket_server
	script_commands._websocket_server = _websocket_server
	scene_commands._websocket_server = _websocket_server
	project_commands._websocket_server = _websocket_server
	editor_commands._websocket_server = _websocket_server
	editor_script_commands._websocket_server = _websocket_server
	advanced_commands._websocket_server = _websocket_server

	# Add them to our processor list
	_command_processors.append(node_commands)
	_command_processors.append(script_commands)
	_command_processors.append(scene_commands)
	_command_processors.append(project_commands)
	_command_processors.append(editor_commands)
	_command_processors.append(editor_script_commands)
	_command_processors.append(advanced_commands)

	# Add them as children for proper lifecycle management
	add_child(node_commands)
	add_child(script_commands)
	add_child(scene_commands)
	add_child(project_commands)
	add_child(editor_commands)
	add_child(editor_script_commands)
	add_child(advanced_commands)

	# Initialize screenshot manager for visual capabilities
	_initialize_screenshot_manager()

	# Initialize fuzzy matcher for enhanced error handling
	_initialize_fuzzy_matcher()

func _handle_command(client_id: int, command: Dictionary) -> void:
	var command_type = command.get("type", "")
	var params = command.get("params", {})
	var command_id = command.get("commandId", "")

	MCPDebugManager.log_command(command_type, params, command_id, "command_handler")

	# Try screenshot commands first
	if _handle_screenshot_command(client_id, command_type, params, command_id):
		MCPDebugManager.log_debug("Command handled by screenshot processor", "command_handler", {
			"command_type": command_type,
			"command_id": command_id
		})
		return

	# Try fuzzy matching commands
	if _handle_fuzzy_command(client_id, command_type, params, command_id):
		MCPDebugManager.log_debug("Command handled by fuzzy matcher", "command_handler", {
			"command_type": command_type,
			"command_id": command_id
		})
		return

	# Fall back to existing command processors
	var processor_found = false
	var processor_names = ["Node", "Script", "Scene", "Project", "Editor", "EditorScript", "Advanced"]
	for i in range(_command_processors.size()):
		var processor = _command_processors[i]
		var processor_name = processor_names[i] if i < processor_names.size() else "Unknown"

		MCPDebugManager.log_trace("Trying processor: %s" % processor_name, "command_handler", {
			"processor_index": i,
			"command_type": command_type
		})

		if processor.process_command(client_id, command_type, params, command_id):
			MCPDebugManager.log_debug("Command handled by processor", "command_handler", {
				"command_type": command_type,
				"processor": processor_name,
				"command_id": command_id
			})
			processor_found = true
			return

	# If no processor handled the command, send an error
	if not processor_found:
		MCPDebugManager.log_error("No processor found for command: %s" % command_type, "command_handler", {
			"command_type": command_type,
			"command_id": command_id
		})
		_send_error(client_id, "Unknown command: %s" % command_type, command_id)

func _send_error(client_id: int, message: String, command_id: String) -> void:
	var response = {
		"status": "error",
		"message": message
	}

	if not command_id.is_empty():
		response["commandId"] = command_id

	_websocket_server.send_response(client_id, response)
	print("Error: %s" % message)

## Initialize screenshot manager
func _initialize_screenshot_manager() -> void:
	print("Initializing screenshot manager...")
	_screenshot_manager = MCPScreenshotManager.new()
	_screenshot_manager.name = "ScreenshotManager"
	add_child(_screenshot_manager)

	# Connect signals
	_screenshot_manager.connect("capture_completed", Callable(self, "_on_screenshot_completed"))
	_screenshot_manager.connect("capture_failed", Callable(self, "_on_screenshot_failed"))

	print("Screenshot manager initialized")

## Initialize fuzzy matcher
func _initialize_fuzzy_matcher() -> void:
	print("Initializing fuzzy matcher...")
	_fuzzy_matcher = MCPFuzzyMatcher.new()
	_fuzzy_matcher.name = "FuzzyMatcher"
	add_child(_fuzzy_matcher)
	print("Fuzzy matcher initialized")

## Handle screenshot commands
func _handle_screenshot_command(client_id: int, command_type: String, params: Dictionary, command_id: String) -> bool:
	match command_type:
		"capture_editor_screenshot":
			_capture_editor_screenshot(client_id, params, command_id)
			return true
		"capture_game_screenshot":
			_capture_game_screenshot(client_id, params, command_id)
			return true
		"get_supported_screenshot_formats":
			_get_supported_screenshot_formats(client_id, params, command_id)
			return true
	return false

## Handle fuzzy matching commands
func _handle_fuzzy_command(client_id: int, command_type: String, params: Dictionary, command_id: String) -> bool:
	match command_type:
		"fuzzy_match_nodes":
			_fuzzy_match_nodes(client_id, params, command_id)
			return true
		"fuzzy_match_scenes":
			_fuzzy_match_scenes(client_id, params, command_id)
			return true
		"fuzzy_match_scripts":
			_fuzzy_match_scripts(client_id, params, command_id)
			return true
	return false

## Capture editor screenshot
func _capture_editor_screenshot(client_id: int, params: Dictionary, command_id: String) -> void:
	if not _screenshot_manager:
		_send_error(client_id, "Screenshot manager not initialized", command_id)
		return

	var format = params.get("format", "png")
	var quality = params.get("quality", 90)

	_screenshot_manager.capture_editor_viewport(format, quality)

	# Store client info for response
	_pending_screenshots[client_id] = {
		"command_id": command_id,
		"type": "editor"
	}

## Capture game screenshot
func _capture_game_screenshot(client_id: int, params: Dictionary, command_id: String) -> void:
	if not _screenshot_manager:
		_send_error(client_id, "Screenshot manager not initialized", command_id)
		return

	var format = params.get("format", "png")
	var quality = params.get("quality", 90)

	_screenshot_manager.capture_game_viewport(format, quality)

	# Store client info for response
	_pending_screenshots[client_id] = {
		"command_id": command_id,
		"type": "game"
	}

## Get supported screenshot formats
func _get_supported_screenshot_formats(client_id: int, params: Dictionary, command_id: String) -> void:
	if not _screenshot_manager:
		_send_error(client_id, "Screenshot manager not initialized", command_id)
		return

	var formats = _screenshot_manager.get_supported_formats()
	_send_success(client_id, {
		"supported_formats": formats,
		"recommendations": {
			"png": "Best for editor screenshots, lossless, supports transparency",
			"jpg": "Best for game screenshots, smaller size, adjustable quality"
		}
	}, command_id)

## Fuzzy match nodes
func _fuzzy_match_nodes(client_id: int, params: Dictionary, command_id: String) -> void:
	if not _fuzzy_matcher:
		_send_error(client_id, "Fuzzy matcher not initialized", command_id)
		return

	var target_path = params.get("target_path", "")
	var available_nodes = params.get("available_nodes", [])
	var max_results = params.get("max_results", 5)

	var result = _fuzzy_matcher.find_node_matches(target_path, available_nodes, max_results)
	_send_success(client_id, result, command_id)

## Fuzzy match scenes
func _fuzzy_match_scenes(client_id: int, params: Dictionary, command_id: String) -> void:
	if not _fuzzy_matcher:
		_send_error(client_id, "Fuzzy matcher not initialized", command_id)
		return

	var target_path = params.get("target_path", "")
	var available_scenes = params.get("available_scenes", [])
	var max_results = params.get("max_results", 5)

	var result = _fuzzy_matcher.find_scene_matches(target_path, available_scenes, max_results)
	_send_success(client_id, result, command_id)

## Fuzzy match scripts
func _fuzzy_match_scripts(client_id: int, params: Dictionary, command_id: String) -> void:
	if not _fuzzy_matcher:
		_send_error(client_id, "Fuzzy matcher not initialized", command_id)
		return

	var target_path = params.get("target_path", "")
	var available_scripts = params.get("available_scripts", [])
	var max_results = params.get("max_results", 5)

	var result = _fuzzy_matcher.find_script_matches(target_path, available_scripts, max_results)
	_send_success(client_id, result, command_id)

## Screenshot completion handlers
var _pending_screenshots = {}

func _on_screenshot_completed(image_data: PackedByteArray, metadata: Dictionary) -> void:
	# Find the client that requested this screenshot
	for client_id in _pending_screenshots:
		var request = _pending_screenshots[client_id]
		var command_id = request.get("command_id", "")

		# Send the image data as base64
		var base64_data = Marshalls.raw_to_base64(image_data)

		_send_success(client_id, {
			"image_data": base64_data,
			"metadata": metadata
		}, command_id)

		# Remove from pending
		_pending_screenshots.erase(client_id)
		break

func _on_screenshot_failed(error_message: String) -> void:
	# Find the client that requested this screenshot
	for client_id in _pending_screenshots:
		var request = _pending_screenshots[client_id]
		var command_id = request.get("command_id", "")

		_send_error(client_id, error_message, command_id)

		# Remove from pending
		_pending_screenshots.erase(client_id)
		break

## Send success response
func _send_success(client_id: int, data: Dictionary, command_id: String) -> void:
	var response = {
		"status": "success",
		"data": data
	}

	if not command_id.is_empty():
		response["commandId"] = command_id

	_websocket_server.send_response(client_id, response)
	print("Success response sent for command: %s" % command_id)

