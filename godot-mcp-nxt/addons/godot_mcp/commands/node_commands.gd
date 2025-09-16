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
		"create_shape_resource":
			_create_shape_resource(client_id, params, command_id)
			return true
		"create_mesh_resource":
			_create_mesh_resource(client_id, params, command_id)
			return true
		"assign_node_resource":
			_assign_node_resource(client_id, params, command_id)
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

func _create_shape_resource(client_id: int, params: Dictionary, command_id: String) -> void:
	var shape_type = params.get("shapeType", "")
	var parameters = params.get("parameters", {})

	# Validation
	if shape_type.is_empty():
		return _send_error(client_id, "Shape type cannot be empty", command_id)

	if not ClassDB.class_exists(shape_type):
		return _send_error(client_id, "Invalid shape type: %s. Available types: BoxShape3D, SphereShape3D, CapsuleShape3D, etc." % shape_type, command_id)

	# Create the shape resource
	var shape
	if ClassDB.can_instantiate(shape_type):
		shape = ClassDB.instantiate(shape_type)
	else:
		return _send_error(client_id, "Cannot instantiate shape of type: %s" % shape_type, command_id)

	if not shape:
		return _send_error(client_id, "Failed to create shape of type: %s" % shape_type, command_id)

	# Apply parameters based on shape type
	match shape_type:
		"BoxShape3D":
			if parameters.has("size"):
				var size = parameters.size
				shape.size = Vector3(size.x, size.y, size.z)
		"SphereShape3D":
			if parameters.has("radius"):
				shape.radius = parameters.radius
		"CapsuleShape3D":
			if parameters.has("radius"):
				shape.radius = parameters.radius
			if parameters.has("height"):
				shape.height = parameters.height
		"CylinderShape3D":
			if parameters.has("radius"):
				shape.top_radius = parameters.radius
				shape.bottom_radius = parameters.radius
			if parameters.has("height"):
				shape.height = parameters.height
		"ConvexPolygonShape3D":
			if parameters.has("points"):
				var points = []
				for point in parameters.points:
					points.append(Vector3(point.x, point.y, point.z))
				shape.points = points

	# Generate a unique resource ID
	var resource_id = "shape_" + str(Time.get_unix_time_from_system() * 1000).replace(".", "_")

	# Store the resource for later assignment
	_store_resource(resource_id, shape)

	_send_success(client_id, {
		"resourceId": resource_id,
		"shapeType": shape_type,
		"parameters": parameters
	}, command_id)

func _create_mesh_resource(client_id: int, params: Dictionary, command_id: String) -> void:
	var mesh_type = params.get("meshType", "")
	var parameters = params.get("parameters", {})

	# Validation
	if mesh_type.is_empty():
		return _send_error(client_id, "Mesh type cannot be empty", command_id)

	if not ClassDB.class_exists(mesh_type):
		return _send_error(client_id, "Invalid mesh type: %s. Available types: BoxMesh, SphereMesh, CapsuleMesh, etc." % mesh_type, command_id)

	# Create the mesh resource
	var mesh
	if ClassDB.can_instantiate(mesh_type):
		mesh = ClassDB.instantiate(mesh_type)
	else:
		return _send_error(client_id, "Cannot instantiate mesh of type: %s" % mesh_type, command_id)

	if not mesh:
		return _send_error(client_id, "Failed to create mesh of type: %s" % mesh_type, command_id)

	# Apply parameters based on mesh type
	match mesh_type:
		"BoxMesh":
			if parameters.has("size"):
				var size = parameters.size
				mesh.size = Vector3(size.x, size.y, size.z)
		"SphereMesh":
			if parameters.has("radius"):
				mesh.radius = parameters.radius
			if parameters.has("height"):
				mesh.height = parameters.height
			if parameters.has("subdivisions"):
				var sub = parameters.subdivisions
				mesh.radial_segments = sub.radial
				mesh.rings = sub.rings
		"CapsuleMesh":
			if parameters.has("radius"):
				mesh.radius = parameters.radius
			if parameters.has("height"):
				mesh.height = parameters.height
		"CylinderMesh":
			if parameters.has("radius"):
				mesh.top_radius = parameters.radius
				mesh.bottom_radius = parameters.radius
			if parameters.has("height"):
				mesh.height = parameters.height
		"PlaneMesh":
			if parameters.has("size"):
				var size = parameters.size
				mesh.size = Vector2(size.x, size.y)

	# Generate a unique resource ID
	var resource_id = "mesh_" + str(Time.get_unix_time_from_system() * 1000).replace(".", "_")

	# Store the resource for later assignment
	_store_resource(resource_id, mesh)

	_send_success(client_id, {
		"resourceId": resource_id,
		"meshType": mesh_type,
		"parameters": parameters
	}, command_id)

func _assign_node_resource(client_id: int, params: Dictionary, command_id: String) -> void:
	var node_path = params.get("nodePath", "")
	var resource_type = params.get("resourceType", "")
	var resource_id = params.get("resourceId", "")

	# Validation
	if node_path.is_empty():
		return _send_error(client_id, "Node path cannot be empty", command_id)

	if resource_type.is_empty():
		return _send_error(client_id, "Resource type cannot be empty", command_id)

	if resource_id.is_empty():
		return _send_error(client_id, "Resource ID cannot be empty", command_id)

	# Get the node
	var node = _get_editor_node(node_path)
	if not node:
		return _send_error(client_id, "Node not found: %s" % node_path, command_id)

	# Get the stored resource
	var resource = _get_stored_resource(resource_id)
	if not resource:
		return _send_error(client_id, "Resource not found: %s" % resource_id, command_id)

	# Assign the resource based on type
	var property_name = ""
	match resource_type:
		"shape":
			if not node is CollisionShape3D:
				return _send_error(client_id, "Node %s is not a CollisionShape3D - cannot assign shape" % node_path, command_id)
			property_name = "shape"
		"mesh":
			if not node is MeshInstance3D:
				return _send_error(client_id, "Node %s is not a MeshInstance3D - cannot assign mesh" % node_path, command_id)
			property_name = "mesh"
		_:
			return _send_error(client_id, "Invalid resource type: %s" % resource_type, command_id)

	# Use undo/redo for proper editor integration
	var undo_redo = _get_undo_redo()
	var old_value = node.get(property_name)

	if not undo_redo:
		# Fallback method
		node.set(property_name, resource)
		_mark_scene_modified()
		print("Assigned %s resource to %s (no undo/redo available)" % [resource_type, node_path])
	else:
		# Use undo/redo
		undo_redo.create_action("Assign " + resource_type.capitalize() + " Resource")
		undo_redo.add_do_property(node, property_name, resource)
		undo_redo.add_undo_property(node, property_name, old_value)
		undo_redo.commit_action()
		print("Assigned %s resource to %s with undo/redo support" % [resource_type, node_path])

	# Mark the scene as modified
	_mark_scene_modified()

	_send_success(client_id, {
		"nodePath": node_path,
		"resourceType": resource_type,
		"resourceId": resource_id,
		"property": property_name
	}, command_id)

# Helper functions for resource management
var _stored_resources = {}

func _store_resource(resource_id: String, resource: Resource) -> void:
	_stored_resources[resource_id] = resource

func _get_stored_resource(resource_id: String) -> Resource:
	return _stored_resources.get(resource_id, null)
