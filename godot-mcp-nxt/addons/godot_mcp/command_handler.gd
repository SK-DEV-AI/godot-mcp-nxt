@tool
class_name MCPCommandHandler
extends Node

var _websocket_server
var _command_processors = []

func _ready():
	print("Command handler initializing...")
	await get_tree().process_frame
	_websocket_server = get_parent()
	print("WebSocket server reference set: ", _websocket_server)
	
	# Initialize command processors
	_initialize_command_processors()

	print("Command handler initialized and ready to process commands")
	print("Available command processors: %d" % _command_processors.size())

func _initialize_command_processors():
	# Create and add all command processors
	var node_commands = MCPNodeCommands.new()
	var script_commands = MCPScriptCommands.new()
	var scene_commands = MCPSceneCommands.new()
	var project_commands = MCPProjectCommands.new()
	var editor_commands = MCPEditorCommands.new()
	var editor_script_commands = MCPEditorScriptCommands.new()  # Add our new processor
	var advanced_commands = MCPAdvancedCommands.new()  # Add advanced commands processor

	# Set server reference for all processors
	node_commands._websocket_server = _websocket_server
	script_commands._websocket_server = _websocket_server
	scene_commands._websocket_server = _websocket_server
	project_commands._websocket_server = _websocket_server
	editor_commands._websocket_server = _websocket_server
	editor_script_commands._websocket_server = _websocket_server  # Set server reference
	advanced_commands._websocket_server = _websocket_server  # Set server reference for advanced commands

	# Add them to our processor list
	_command_processors.append(node_commands)
	_command_processors.append(script_commands)
	_command_processors.append(scene_commands)
	_command_processors.append(project_commands)
	_command_processors.append(editor_commands)
	_command_processors.append(editor_script_commands)  # Add to processor list
	_command_processors.append(advanced_commands)  # Add advanced commands to processor list

	# Add them as children for proper lifecycle management
	add_child(node_commands)
	add_child(script_commands)
	add_child(scene_commands)
	add_child(project_commands)
	add_child(editor_commands)
	add_child(editor_script_commands)  # Add as child
	add_child(advanced_commands)  # Add advanced commands as child

func _handle_command(client_id: int, command: Dictionary) -> void:
	var command_type = command.get("type", "")
	var params = command.get("params", {})
	var command_id = command.get("commandId", "")

	print("Processing command: %s (Client: %d, ID: %s)" % [command_type, client_id, command_id])

	# Try each processor until one handles the command
	var processor_found = false
	for i in range(_command_processors.size()):
		var processor = _command_processors[i]
		var processor_name = processor.get_class() if processor.has_method("get_class") else "Unknown"
		print("Trying processor %d: %s" % [i, processor_name])

		if processor.process_command(client_id, command_type, params, command_id):
			print("Command %s handled by processor: %s" % [command_type, processor_name])
			processor_found = true
			return

	# If no processor handled the command, send an error
	if not processor_found:
		print("No processor found for command: %s" % command_type)
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
