@tool
class_name MCPNodeCommands
extends MCPBaseCommandProcessor

func process_command(client_id: int, command_type: String, params: Dictionary, command_id: String) -> bool:
	match command_type:
		"create_node":
			_create_node(client_id, params, command_id)
			return true
		"delete_node":
			_delete_node(client_id, params, command_id)
			return true
		"update_node_property":
			_update_node_property(client_id, params, command_id)
			return true
		"get_node_properties":
			_get_node_properties(client_id, params, command_id)
			return true
		"list_nodes":
			_list_nodes(client_id, params, command_id)
			return true
	return false  # Command not handled

func _create_node(client_id: int, params: Dictionary, command_id: String) -> void:
	var parent_path = params.get("parent_path", "/root")
	var node_type = params.get("node_type", "Node")
	var node_name = params.get("node_name", "NewNode")

	# Enhanced validation
	if not _validate_node_path(parent_path):
		return _send_error(client_id, "Invalid parent path format: %s" % parent_path, command_id)

	if not ClassDB.class_exists(node_type):
		return _send_error(client_id, "Invalid node type: %s. Available types include: Node, Node2D, Sprite2D, Label, etc." % node_type, command_id)

	if node_name.is_empty() or node_name.contains("/") or node_name.contains("\\"):
		return _send_error(client_id, "Invalid node name: %s. Name cannot be empty or contain path separators." % node_name, command_id)

	# Check scene complexity for large projects
	var complexity = _get_scene_complexity()
	if complexity.has("total_nodes") and complexity.total_nodes > 1000:
		push_warning("Scene has %d nodes - performance may be affected" % complexity.total_nodes)

	# Get editor plugin and interfaces
	var plugin = Engine.get_meta("GodotMCPPlugin")
	if not plugin:
		return _send_error(client_id, "GodotMCPPlugin not found in Engine metadata", command_id)

	var editor_interface = plugin.get_editor_interface()
	var edited_scene_root = editor_interface.get_edited_scene_root()

	if not edited_scene_root:
		return _send_error(client_id, "No scene is currently being edited. Please open a scene first.", command_id)

	# Get the parent node using the editor node helper
	var parent = _get_editor_node(parent_path)
	if not parent:
		var available_paths = []
		for child in edited_scene_root.get_children():
			available_paths.append("/root/" + child.name)
		return _send_error(client_id, "Parent node not found: %s. Available paths: %s" % [parent_path, available_paths], command_id)
	
	# Create the node
	var node
	if ClassDB.can_instantiate(node_type):
		node = ClassDB.instantiate(node_type)
	else:
		return _send_error(client_id, "Cannot instantiate node of type: %s" % node_type, command_id)
	
	if not node:
		return _send_error(client_id, "Failed to create node of type: %s" % node_type, command_id)
	
	# Set the node name
	node.name = node_name
	
	# Add the node to the parent
	parent.add_child(node)
	
	# Set owner for proper serialization
	node.owner = edited_scene_root
	
	# Mark the scene as modified
	_mark_scene_modified()
	
	_send_success(client_id, {
		"node_path": parent_path + "/" + node_name
	}, command_id)

func _delete_node(client_id: int, params: Dictionary, command_id: String) -> void:
	var node_path = params.get("node_path", "")
	
	# Validation
	if node_path.is_empty():
		return _send_error(client_id, "Node path cannot be empty", command_id)
	
	# Get editor plugin and interfaces
	var plugin = Engine.get_meta("GodotMCPPlugin")
	if not plugin:
		return _send_error(client_id, "GodotMCPPlugin not found in Engine metadata", command_id)
	
	var editor_interface = plugin.get_editor_interface()
	var edited_scene_root = editor_interface.get_edited_scene_root()
	
	if not edited_scene_root:
		return _send_error(client_id, "No scene is currently being edited", command_id)
	
	# Get the node using the editor node helper
	var node = _get_editor_node(node_path)
	if not node:
		return _send_error(client_id, "Node not found: %s" % node_path, command_id)
	
	# Cannot delete the root node
	if node == edited_scene_root:
		return _send_error(client_id, "Cannot delete the root node", command_id)
	
	# Get parent for operation
	var parent = node.get_parent()
	if not parent:
		return _send_error(client_id, "Node has no parent: %s" % node_path, command_id)
	
	# Remove the node
	parent.remove_child(node)
	node.queue_free()
	
	# Mark the scene as modified
	_mark_scene_modified()
	
	_send_success(client_id, {
		"deleted_node_path": node_path
	}, command_id)

func _update_node_property(client_id: int, params: Dictionary, command_id: String) -> void:
	var node_path = params.get("node_path", "")
	var property_name = params.get("property", "")
	var property_value = params.get("value")

	# Enhanced validation
	if not _validate_node_path(node_path):
		return _send_error(client_id, "Invalid node path format: %s" % node_path, command_id)

	if property_name.is_empty():
		return _send_error(client_id, "Property name cannot be empty", command_id)

	if property_value == null:
		return _send_error(client_id, "Property value cannot be null", command_id)

	# Get editor plugin and interfaces
	var plugin = Engine.get_meta("GodotMCPPlugin")
	if not plugin:
		return _send_error(client_id, "GodotMCPPlugin not found in Engine metadata", command_id)

	# Get the node using the editor node helper
	var node = _get_editor_node(node_path)
	if not node:
		return _send_error(client_id, "Node not found: %s. Make sure the node exists and the path is correct." % node_path, command_id)

	# Check if the property exists
	if not property_name in node:
		var available_props = []
		for prop in node.get_property_list():
			if not prop["name"].begins_with("_"):
				available_props.append(prop["name"])
		return _send_error(client_id, "Property '%s' does not exist on node %s. Available properties: %s" % [property_name, node_path, available_props], command_id)

	# Parse property value for Godot types
	var parsed_value = _parse_property_value(property_value)

	# Validate property type compatibility
	var current_value = node.get(property_name)
	var expected_type = typeof(current_value)
	var provided_type = typeof(parsed_value)

	if expected_type != provided_type and expected_type != TYPE_NIL:
		# Allow some type conversions (int/float, etc.)
		if not ((expected_type == TYPE_INT and provided_type == TYPE_FLOAT) or
				(expected_type == TYPE_FLOAT and provided_type == TYPE_INT)):
			push_warning("Type mismatch for property %s: expected %s, got %s" % [property_name, expected_type, provided_type])

	# Get current property value for undo
	var old_value = current_value

	# Get undo/redo system
	var undo_redo = _get_undo_redo()
	if not undo_redo:
		# Fallback method if we can't get undo/redo
		node.set(property_name, parsed_value)
		_mark_scene_modified()
		print("Updated property %s on %s (no undo/redo available)" % [property_name, node_path])
	else:
		# Use undo/redo for proper editor integration
		undo_redo.create_action("Update Property: " + property_name)
		undo_redo.add_do_property(node, property_name, parsed_value)
		undo_redo.add_undo_property(node, property_name, old_value)
		undo_redo.commit_action()
		print("Updated property %s on %s with undo/redo support" % [property_name, node_path])

	# Mark the scene as modified
	_mark_scene_modified()

	_send_success(client_id, {
		"node_path": node_path,
		"property": property_name,
		"value": property_value,
		"parsed_value": str(parsed_value),
		"old_value": str(old_value)
	}, command_id)

func _get_node_properties(client_id: int, params: Dictionary, command_id: String) -> void:
	var node_path = params.get("node_path", "")
	
	# Validation
	if node_path.is_empty():
		return _send_error(client_id, "Node path cannot be empty", command_id)
	
	# Get the node using the editor node helper
	var node = _get_editor_node(node_path)
	if not node:
		return _send_error(client_id, "Node not found: %s" % node_path, command_id)
	
	# Get all properties
	var properties = {}
	var property_list = node.get_property_list()
	
	for prop in property_list:
		var name = prop["name"]
		if not name.begins_with("_"):  # Skip internal properties
			properties[name] = node.get(name)
	
	_send_success(client_id, {
		"node_path": node_path,
		"properties": properties
	}, command_id)

func _list_nodes(client_id: int, params: Dictionary, command_id: String) -> void:
	var parent_path = params.get("parent_path", "/root")
	
	# Get the parent node using the editor node helper
	var parent = _get_editor_node(parent_path)
	if not parent:
		return _send_error(client_id, "Parent node not found: %s" % parent_path, command_id)
	
	# Get children
	var children = []
	for child in parent.get_children():
		children.append({
			"name": child.name,
			"type": child.get_class(),
			"path": str(child.get_path()).replace(str(parent.get_path()), parent_path)
		})
	
	_send_success(client_id, {
		"parent_path": parent_path,
		"children": children
	}, command_id)
