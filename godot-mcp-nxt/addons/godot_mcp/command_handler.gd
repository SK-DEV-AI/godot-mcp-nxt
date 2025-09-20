@tool
class_name MCPCommandHandler
extends Node

var _websocket_server
var _command_processors = []
var _fuzzy_matcher = null
var _debug_manager = null

func _ready():
	# Get debug manager reference from parent
	_debug_manager = get_parent().get_node("DebugManager")
	if _debug_manager:
		_debug_manager.info("Command handler initializing...", "command_handler")
	else:
		print("Command handler initializing...")

	await get_tree().process_frame
	_websocket_server = get_parent()
	if _debug_manager:
		_debug_manager.debug("WebSocket server reference set", "command_handler", {"server": _websocket_server})
	else:
		print("WebSocket server reference set")

	# Initialize command processors
	_initialize_command_processors()

	if _debug_manager:
		_debug_manager.info("Command handler initialized and ready to process commands", "command_handler", {
			"processor_count": _command_processors.size()
		})
	else:
		print("Command handler initialized and ready to process commands")

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

	# Initialize fuzzy matcher for enhanced error handling
	_initialize_fuzzy_matcher()

func _handle_command(client_id: int, command: Dictionary) -> void:
	var command_type = command.get("type", "")
	var params = command.get("params", {})
	var command_id = command.get("commandId", "")

	print("DEBUG: Command handler received command: ", command_type, " with params: ", params)

	if _debug_manager:
		_debug_manager.log_command(command_type, params, command_id, "command_handler")

	# Try fuzzy matching commands
	if _handle_fuzzy_command(client_id, command_type, params, command_id):
		if _debug_manager:
			_debug_manager.debug("Command handled by fuzzy matcher", "command_handler", {
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

		print("DEBUG: Trying processor: %s for command: %s" % [processor_name, command_type])

		if _debug_manager:
			_debug_manager.trace("Trying processor: %s" % processor_name, "command_handler", {
				"processor_index": i,
				"command_type": command_type
			})

		if processor.process_command(client_id, command_type, params, command_id):
			print("DEBUG: Command handled by processor: %s" % processor_name)
			if _debug_manager:
				_debug_manager.debug("Command handled by processor", "command_handler", {
					"command_type": command_type,
					"processor": processor_name,
					"command_id": command_id
				})
			processor_found = true
			return

	# If no processor handled the command, send an error
	if not processor_found:
		print("DEBUG: No processor found for command: %s" % command_type)
		if _debug_manager:
			_debug_manager.error("No processor found for command: %s" % command_type, "command_handler", {
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

## Initialize fuzzy matcher
func _initialize_fuzzy_matcher() -> void:
	print("Initializing fuzzy matcher...")
	_fuzzy_matcher = MCPFuzzyMatcher.new()
	_fuzzy_matcher.name = "FuzzyMatcher"
	add_child(_fuzzy_matcher)
	print("Fuzzy matcher initialized")

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


## Send success response
func _send_success(client_id: int, data: Dictionary, command_id: String) -> void:
	var response = {
		"status": "success",
		"data": data
	}

	if not command_id.is_empty():
		response["commandId"] = command_id

	_websocket_server.send_response(client_id, response)

