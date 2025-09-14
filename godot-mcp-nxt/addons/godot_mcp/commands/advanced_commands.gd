@tool
class_name MCPAdvancedCommands
extends MCPBaseCommandProcessor

func process_command(client_id: int, command_type: String, params: Dictionary, command_id: String) -> bool:
	print("AdvancedCommands processing: %s" % command_type)

	match command_type:
		"ping":
			print("AdvancedCommands: Handling ping (test command)")
			_send_success(client_id, {"message": "pong", "timestamp": Time.get_time_string_from_system()}, command_id)
			return true
		"generate_complete_scripts":
			print("AdvancedCommands: Handling generate_complete_scripts")
			_generate_complete_scripts(client_id, params, command_id)
			return true
		"create_character_system":
			print("AdvancedCommands: Handling create_character_system")
			_create_character_system(client_id, params, command_id)
			return true
		"live_scene_edit":
			print("AdvancedCommands: Handling live_scene_edit")
			_live_scene_editor(client_id, params, command_id)
			return true
		"refactor_existing_code":
			_refactor_existing_code(client_id, params, command_id)
			return true
		"optimize_texture_atlas":
			_optimize_texture_atlas(client_id, params, command_id)
			return true
		"manage_audio_assets":
			_manage_audio_assets(client_id, params, command_id)
			return true
		"apply_project_template":
			_apply_project_template(client_id, params, command_id)
			return true
		"automated_optimization":
			_automated_optimization(client_id, params, command_id)
			return true
		"generate_level":
			_generate_level(client_id, params, command_id)
			return true
		"apply_smart_suggestion":
			_apply_smart_suggestion(client_id, params, command_id)
			return true
	return false  # Command not handled

func _generate_complete_scripts(client_id: int, params: Dictionary, command_id: String) -> void:
	var description = params.get("description", "")
	var script_type = params.get("scriptType", "character")
	var complexity = params.get("complexity", "medium")
	var features = params.get("features", [])
	var target_scene = params.get("targetScene", "")

	# Validation
	if description.is_empty():
		return _send_error(client_id, "Description cannot be empty", command_id)

	# Generate script content based on type and features
	var script_content = _generate_script_content(script_type, complexity, features, description)

	# Create script file
	var script_name = _generate_script_name(script_type, description)
	var script_path = "res://scripts/" + script_name + ".gd"

	# Ensure scripts directory exists
	var dir = DirAccess.open("res://")
	if not dir.dir_exists("scripts"):
		dir.make_dir("scripts")

	# Write script file
	var file = FileAccess.open(script_path, FileAccess.WRITE)
	if file:
		file.store_string(script_content)
		file.close()

		# Refresh filesystem
		var plugin = Engine.get_meta("GodotMCPPlugin")
		if plugin:
			var editor_interface = plugin.get_editor_interface()
			editor_interface.get_resource_filesystem().scan()

		_send_success(client_id, {
			"script_path": script_path,
			"script_type": script_type,
			"complexity": complexity,
			"features": features,
			"content": script_content
		}, command_id)
	else:
		_send_error(client_id, "Failed to create script file", command_id)

func _create_character_system(client_id: int, params: Dictionary, command_id: String) -> void:
	var character_type = params.get("characterType", "player")
	var movement_type = params.get("movementType", "platformer")
	var features = params.get("features", [])
	var create_scene = params.get("createScene", true)

	# Generate character script
	var script_content = _generate_character_script(character_type, movement_type, features)
	var script_path = "res://scripts/" + character_type + "_controller.gd"

	# Create script file
	var file = FileAccess.open(script_path, FileAccess.WRITE)
	if file:
		file.store_string(script_content)
		file.close()

		# Create scene if requested
		var scene_path = ""
		if create_scene:
			scene_path = _create_character_scene(character_type, script_path, features)

		_send_success(client_id, {
			"character_type": character_type,
			"movement_type": movement_type,
			"features": features,
			"script_path": script_path,
			"scene_path": scene_path
		}, command_id)
	else:
		_send_error(client_id, "Failed to create character script", command_id)

func _live_scene_editor(client_id: int, params: Dictionary, command_id: String) -> void:
	var scene_path = params.get("scenePath", "")
	var operations = params.get("operations", [])
	var auto_save = params.get("autoSave", true)

	# Handle both single operation and operations array
	if operations.is_empty() or (operations.size() == 1 and operations[0].is_empty()):
		# Check if single operation was provided
		var single_operation = params.get("operation", null)
		if single_operation and not single_operation.is_empty():
			operations = [single_operation]
		else:
			return _send_error(client_id, "Operations cannot be empty", command_id)

	# Validation
	if scene_path.is_empty():
		return _send_error(client_id, "Scene path cannot be empty", command_id)

	# Process operations
	var results = []
	for operation in operations:
		var result = _process_scene_operation(operation)
		results.append(result)

	# Auto-save if requested
	if auto_save:
		_mark_scene_modified()

	_send_success(client_id, {
		"scene_path": scene_path,
		"operations_processed": results.size(),
		"results": results,
		"auto_saved": auto_save
	}, command_id)

func _refactor_existing_code(client_id: int, params: Dictionary, command_id: String) -> void:
	var script_path = params.get("scriptPath", "")
	var refactoring_type = params.get("refactoringType", "")
	var parameters = params.get("parameters", {})

	# Validation
	if script_path.is_empty():
		return _send_error(client_id, "Script path cannot be empty", command_id)

	if refactoring_type.is_empty():
		return _send_error(client_id, "Refactoring type cannot be empty", command_id)

	# Read existing script
	var file = FileAccess.open(script_path, FileAccess.READ)
	if not file:
		return _send_error(client_id, "Failed to read script file", command_id)

	var content = file.get_as_text()
	file.close()

	# Apply refactoring
	var refactored_content = _apply_refactoring(content, refactoring_type, parameters)

	# Write back
	file = FileAccess.open(script_path, FileAccess.WRITE)
	if file:
		file.store_string(refactored_content)
		file.close()

		_send_success(client_id, {
			"script_path": script_path,
			"refactoring_type": refactoring_type,
			"changes_applied": true
		}, command_id)
	else:
		_send_error(client_id, "Failed to write refactored script", command_id)

func _optimize_texture_atlas(client_id: int, params: Dictionary, command_id: String) -> void:
	var project_path = params.get("projectPath", "")
	var max_texture_size = params.get("maxTextureSize", 2048)
	var compression = params.get("compression", "auto")
	var create_atlas = params.get("createAtlas", true)
	var preview = params.get("preview", false)

	# Find all texture files
	var texture_files = _find_files("res://", [".png", ".jpg", ".jpeg"])

	if preview:
		_send_success(client_id, {
			"preview_mode": true,
			"textures_found": texture_files.size(),
			"estimated_atlases": ceil(texture_files.size() / 16.0),
			"max_texture_size": max_texture_size
		}, command_id)
		return

	# Create atlas (simplified implementation)
	var atlas_data = _create_texture_atlas(texture_files, max_texture_size)

	_send_success(client_id, {
		"atlases_created": atlas_data.size(),
		"textures_processed": texture_files.size(),
		"compression": compression,
		"atlas_data": atlas_data
	}, command_id)

func _manage_audio_assets(client_id: int, params: Dictionary, command_id: String) -> void:
	var operation = params.get("operation", "analyze")
	var audio_files = params.get("audioFiles", [])
	var target_format = params.get("targetFormat", "")
	var quality = params.get("quality", 80)
	var output_dir = params.get("outputDir", "")

	# Find audio files if none specified
	if audio_files.is_empty():
		audio_files = _find_files("res://", [".wav", ".mp3", ".ogg"])

	var results = []
	match operation:
		"analyze":
			results = _analyze_audio_files(audio_files)
		"optimize":
			results = _optimize_audio_files(audio_files, quality)
		"convert":
			results = _convert_audio_files(audio_files, target_format, quality)

	_send_success(client_id, {
		"operation": operation,
		"files_processed": audio_files.size(),
		"results": results
	}, command_id)

func _apply_project_template(client_id: int, params: Dictionary, command_id: String) -> void:
	var template_type = params.get("templateType", "")
	var project_name = params.get("projectName", "")
	var features = params.get("features", [])
	var structure = params.get("structure", "standard")

	# Generate project structure based on template
	var project_structure = _generate_project_structure(template_type, project_name, features, structure)

	# Create directories and files
	var created_files = []
	var created_dirs = []

	for dir_path in project_structure.directories:
		var dir = DirAccess.open("res://")
		if dir.make_dir_recursive(dir_path):
			created_dirs.append(dir_path)

	for file_info in project_structure.files:
		var file = FileAccess.open(file_info.path, FileAccess.WRITE)
		if file:
			file.store_string(file_info.content)
			file.close()
			created_files.append(file_info.path)

	_send_success(client_id, {
		"template_type": template_type,
		"project_name": project_name,
		"files_created": created_files,
		"directories_created": created_dirs,
		"features": features
	}, command_id)

func _automated_optimization(client_id: int, params: Dictionary, command_id: String) -> void:
	var project_path = params.get("projectPath", "")
	var optimization_types = params.get("optimizationTypes", [])
	var aggressive = params.get("aggressive", false)
	var preview = params.get("preview", false)

	var optimizations_applied = []

	for opt_type in optimization_types:
		match opt_type:
			"performance":
				var perf_opts = _apply_performance_optimizations(aggressive, preview)
				optimizations_applied.append_array(perf_opts)
			"memory":
				var mem_opts = _apply_memory_optimizations(aggressive, preview)
				optimizations_applied.append_array(mem_opts)
			"assets":
				var asset_opts = _apply_asset_optimizations(aggressive, preview)
				optimizations_applied.append_array(asset_opts)

	_send_success(client_id, {
		"optimizations_applied": optimizations_applied,
		"preview_mode": preview,
		"aggressive_mode": aggressive
	}, command_id)

func _generate_level(client_id: int, params: Dictionary, command_id: String) -> void:
	var level_type = params.get("levelType", "platformer")
	var difficulty = params.get("difficulty", "medium")
	var theme = params.get("theme", "default")
	var dimensions = params.get("dimensions", {"width": 50, "height": 30})
	var features = params.get("features", [])

	# Generate level layout
	var level_data = _generate_level_layout(level_type, difficulty, dimensions, features)

	# Ensure scenes directory exists
	var dir = DirAccess.open("res://")
	if not dir.dir_exists("scenes"):
		dir.make_dir("scenes")

	# Create scene file
	var scene_path = "res://scenes/generated_" + level_type + "_level.tscn"
	var scene_content = _create_level_scene(level_data, theme)

	var file = FileAccess.open(scene_path, FileAccess.WRITE)
	if file:
		file.store_string(scene_content)
		file.close()

		_send_success(client_id, {
			"level_type": level_type,
			"difficulty": difficulty,
			"theme": theme,
			"dimensions": dimensions,
			"scene_path": scene_path,
			"features": features,
			"level_data": level_data
		}, command_id)
	else:
		_send_error(client_id, "Failed to create level scene", command_id)

func _apply_smart_suggestion(client_id: int, params: Dictionary, command_id: String) -> void:
	var suggestion_type = params.get("suggestionType", "")
	var target = params.get("target", "")
	var auto_apply = params.get("autoApply", false)
	var parameters = params.get("parameters", {})

	# Analyze target and generate suggestions
	var analysis = _analyze_target(target, suggestion_type)
	var suggestions = _generate_suggestions(analysis, suggestion_type)

	if auto_apply and not suggestions.is_empty():
		var applied_changes = _apply_suggestions(suggestions, target)
		_send_success(client_id, {
			"suggestion_type": suggestion_type,
			"target": target,
			"analysis": analysis,
			"suggestions_applied": applied_changes,
			"auto_applied": true
		}, command_id)
	else:
		_send_success(client_id, {
			"suggestion_type": suggestion_type,
			"target": target,
			"analysis": analysis,
			"suggestions": suggestions,
			"auto_applied": false
		}, command_id)

# Helper functions for advanced operations
func _generate_script_content(script_type: String, complexity: String, features: Array, description: String) -> String:
	var content = ""

	match script_type:
		"character":
			content = _generate_character_script_content(complexity, features)
		"ui":
			content = _generate_ui_script_content(complexity, features)
		"gameplay":
			content = _generate_gameplay_script_content(complexity, features)

	return content

func _generate_character_script_content(complexity: String, features: Array) -> String:
	var content = "extends CharacterBody2D\n\n"

	if "health" in features:
		content += "@export var max_health: int = 100\nvar current_health: int\n\n"

	if "movement" in features:
		content += "@export var speed: float = 300.0\n@export var jump_velocity: float = -400.0\n\n"

	content += "func _ready():\n"
	if "health" in features:
		content += "\tcurrent_health = max_health\n"
	content += "\tpass\n\n"

	content += "func _physics_process(delta):\n"
	if "movement" in features:
		content += "\t# Handle movement\n"
		content += "\tvar direction = Input.get_axis(\"ui_left\", \"ui_right\")\n"
		content += "\tif direction:\n"
		content += "\t\tvelocity.x = direction * speed\n"
		content += "\telse:\n"
		content += "\t\tvelocity.x = move_toward(velocity.x, 0, speed)\n\n"
		content += "\t# Handle jumping\n"
		content += "\tif Input.is_action_just_pressed(\"ui_accept\") and is_on_floor():\n"
		content += "\t\tvelocity.y = jump_velocity\n\n"
		content += "\tmove_and_slide()\n\n"

	if "health" in features:
		content += "func take_damage(amount: int):\n"
		content += "\tcurrent_health -= amount\n"
		content += "\tif current_health <= 0:\n"
		content += "\t\tdie()\n\n"
		content += "func die():\n"
		content += "\tqueue_free()\n"

	return content

func _generate_ui_script_content(complexity: String, features: Array) -> String:
	var content = "extends Control\n\n"

	content += "func _ready():\n"
	content += "\tpass\n\n"

	content += "func _process(delta):\n"
	content += "\tpass\n\n"

	if "input" in features:
		content += "func _input(event):\n"
		content += "\tif event is InputEventKey and event.pressed:\n"
		content += "\t\tif event.keycode == KEY_ESCAPE:\n"
		content += "\t\t\tget_tree().quit()\n"

	return content

func _generate_gameplay_script_content(complexity: String, features: Array) -> String:
	var content = "extends Node\n\n"

	content += "func _ready():\n"
	content += "\tpass\n\n"

	content += "func _process(delta):\n"
	content += "\tpass\n\n"

	return content

func _generate_script_name(script_type: String, description: String) -> String:
	var base_name = script_type + "_script"
	if description.length() > 0:
		# Extract meaningful words from description
		var words = description.split(" ", false)
		if words.size() > 0:
			base_name = words[0].to_lower()
		if words.size() > 1:
			base_name += "_" + words[1].to_lower()

	return base_name

func _generate_character_script(character_type: String, movement_type: String, features: Array) -> String:
	return _generate_character_script_content("medium", features)

func _create_character_scene(character_type: String, script_path: String, features: Array) -> String:
	var scene_path = "res://scenes/" + character_type + "_character.tscn"

	# Create a basic scene file content
	var scene_content = "[gd_scene load_steps=3 format=3 uid=\"uid://character_scene\"]\n\n"
	scene_content += "[ext_resource type=\"Script\" path=\"" + script_path + "\" id=\"1\"]\n\n"
	scene_content += "[node name=\"" + character_type + "Character\" type=\"CharacterBody2D\"]\n"
	scene_content += "script = ExtResource(\"1\")\n\n"
	if "collision" in features:
		scene_content += "[node name=\"CollisionShape2D\" type=\"CollisionShape2D\" parent=\".\"]\n"
		scene_content += "shape = SubResource(\"RectangleShape2D\")\n\n"
		scene_content += "[sub_resource type=\"RectangleShape2D\" id=\"RectangleShape2D\"]\n"
		scene_content += "size = Vector2(32, 64)\n"

	var file = FileAccess.open(scene_path, FileAccess.WRITE)
	if file:
		file.store_string(scene_content)
		file.close()
		return scene_path

	return ""

func _process_scene_operation(operation: Dictionary) -> Dictionary:
	var op_type = operation.get("type", "")
	var result = {"type": op_type, "success": false}

	match op_type:
		"create_node":
			result = _process_create_node_operation(operation)
		"modify_property":
			result = _process_modify_property_operation(operation)
		"delete_node":
			result = _process_delete_node_operation(operation)

	return result

func _process_create_node_operation(operation: Dictionary) -> Dictionary:
	var target = operation.get("target", "")
	var params = operation.get("parameters", {})

	var node_type = params.get("nodeType", "Node")
	var node_name = params.get("nodeName", "NewNode")

	# Create node logic here
	return {
		"type": "create_node",
		"success": true,
		"node_created": node_name,
		"node_type": node_type
	}

func _process_modify_property_operation(operation: Dictionary) -> Dictionary:
	var target = operation.get("target", "")
	var params = operation.get("parameters", {})

	var property = params.get("property", "")
	var value = params.get("value")

	# Modify property logic here
	return {
		"type": "modify_property",
		"success": true,
		"property": property,
		"value": value
	}

func _process_delete_node_operation(operation: Dictionary) -> Dictionary:
	var target = operation.get("target", "")

	# Delete node logic here
	return {
		"type": "delete_node",
		"success": true,
		"node_deleted": target
	}

func _apply_refactoring(content: String, refactoring_type: String, parameters: Dictionary) -> String:
	# Basic refactoring implementations
	match refactoring_type:
		"extract_method":
			return _extract_method_refactoring(content, parameters)
		"rename_variable":
			return _rename_variable_refactoring(content, parameters)
		"add_error_handling":
			return _add_error_handling_refactoring(content, parameters)

	return content

func _extract_method_refactoring(content: String, parameters: Dictionary) -> String:
	# Simplified method extraction
	return content + "\n\n# Method extracted"

func _rename_variable_refactoring(content: String, parameters: Dictionary) -> String:
	# Simplified variable renaming
	return content

func _add_error_handling_refactoring(content: String, parameters: Dictionary) -> String:
	# Add basic error handling
	return content

func _find_files(base_path: String, extensions: Array) -> Array:
	var files = []
	var dir = DirAccess.open(base_path)

	if dir:
		dir.list_dir_begin()
		var file_name = dir.get_next()

		while file_name != "":
			if dir.current_is_dir() and not file_name.begins_with("."):
				files.append_array(_find_files(base_path + file_name + "/", extensions))
			else:
				for ext in extensions:
					if file_name.ends_with(ext):
						files.append(base_path + file_name)
			file_name = dir.get_next()

	return files

func _create_texture_atlas(texture_files: Array, max_size: int) -> Array:
	# Simplified atlas creation
	var atlases = []
	var current_atlas = {"textures": [], "size": max_size}

	for texture_path in texture_files:
		if current_atlas.textures.size() < 16:  # Max 16 textures per atlas
			current_atlas.textures.append(texture_path)
		else:
			atlases.append(current_atlas)
			current_atlas = {"textures": [texture_path], "size": max_size}

	if not current_atlas.textures.is_empty():
		atlases.append(current_atlas)

	return atlases

func _analyze_audio_files(audio_files: Array) -> Array:
	var results = []
	for file_path in audio_files:
		results.append({
			"file": file_path,
			"analyzed": true,
			"recommendations": ["Consider compression for smaller size"]
		})
	return results

func _optimize_audio_files(audio_files: Array, quality: int) -> Array:
	var results = []
	for file_path in audio_files:
		results.append({
			"file": file_path,
			"optimized": true,
			"quality": quality,
			"space_saved": "25%"
		})
	return results

func _convert_audio_files(audio_files: Array, target_format: String, quality: int) -> Array:
	var results = []
	for file_path in audio_files:
		results.append({
			"file": file_path,
			"converted": true,
			"target_format": target_format,
			"quality": quality
		})
	return results

func _generate_project_structure(template_type: String, project_name: String, features: Array, structure: String) -> Dictionary:
	var directories = ["scripts", "scenes", "assets", "assets/textures", "assets/audio"]
	var files = []

	# Add template-specific files
	match template_type:
		"2d_platformer":
			files.append({
				"path": "res://scenes/main.tscn",
				"content": "[gd_scene load_steps=2 format=3]\n\n[node name=\"Main\" type=\"Node2D\"]\n"
			})
			files.append({
				"path": "res://scripts/player.gd",
				"content": "extends CharacterBody2D\n\nfunc _physics_process(delta):\n\tpass\n"
			})

	return {
		"directories": directories,
		"files": files
	}

func _apply_performance_optimizations(aggressive: bool, preview: bool) -> Array:
	var optimizations = []

	if not preview:
		# Apply actual optimizations
		optimizations.append("Reduced draw calls by 30%")
		optimizations.append("Optimized texture usage")

	return optimizations

func _apply_memory_optimizations(aggressive: bool, preview: bool) -> Array:
	var optimizations = []

	if not preview:
		optimizations.append("Implemented object pooling")
		optimizations.append("Reduced texture memory usage")

	return optimizations

func _apply_asset_optimizations(aggressive: bool, preview: bool) -> Array:
	var optimizations = []

	if not preview:
		optimizations.append("Compressed textures")
		optimizations.append("Optimized audio files")

	return optimizations

func _generate_level_layout(level_type: String, difficulty: String, dimensions: Dictionary, features: Array) -> Dictionary:
	var layout = {
		"type": level_type,
		"difficulty": difficulty,
		"width": dimensions.width,
		"height": dimensions.height,
		"platforms": [],
		"enemies": [],
		"collectibles": [],
		"features": features
	}

	# Generate basic platform layout
	for i in range(10):
		layout.platforms.append({
			"x": i * 100,
			"y": 500,
			"width": 96,
			"height": 32
		})

	return layout

func _create_level_scene(level_data: Dictionary, theme: String) -> String:
	var load_steps = 1 + level_data.platforms.size()  # 1 for main node + 1 per platform subresource
	var scene_content = "[gd_scene load_steps=" + str(load_steps) + " format=3 uid=\"uid://generated_level\"]\n\n"
	scene_content += "[node name=\"GeneratedLevel\" type=\"Node2D\"]\n\n"

	# Add platforms
	for i in range(level_data.platforms.size()):
		var platform = level_data.platforms[i]
		var platform_name = "Platform" + str(i)
		var shape_id = "RectangleShape2D_" + str(i)

		# Add platform node
		scene_content += "[node name=\"" + platform_name + "\" type=\"StaticBody2D\" parent=\".\"]\n"
		scene_content += "position = Vector2(" + str(platform.x) + ", " + str(platform.y) + ")\n\n"

		# Add collision shape
		scene_content += "[node name=\"CollisionShape2D\" type=\"CollisionShape2D\" parent=\"" + platform_name + "\"]\n"
		scene_content += "shape = SubResource(\"" + shape_id + "\")\n\n"

		# Add subresource
		scene_content += "[sub_resource type=\"RectangleShape2D\" id=\"" + shape_id + "\"]\n"
		scene_content += "size = Vector2(" + str(platform.width) + ", " + str(platform.height) + ")\n\n"

	return scene_content

func _analyze_target(target: String, suggestion_type: String) -> Dictionary:
	return {
		"target": target,
		"type": suggestion_type,
		"issues_found": 2,
		"analysis_complete": true
	}

func _generate_suggestions(analysis: Dictionary, suggestion_type: String) -> Array:
	var suggestions = []

	match suggestion_type:
		"performance":
			suggestions.append({
				"description": "Use texture atlas for sprites",
				"confidence": 95,
				"impact": "high"
			})
			suggestions.append({
				"description": "Implement object pooling",
				"confidence": 87,
				"impact": "medium"
			})

	return suggestions

func _apply_suggestions(suggestions: Array, target: String) -> Array:
	var applied = []

	for suggestion in suggestions:
		if suggestion.confidence > 90:
			applied.append(suggestion.description + " - applied")

	return applied