@tool
class_name MCPProjectCommands
extends MCPBaseCommandProcessor

var _debug_manager = null

func _init():
	# Debug manager will be found in _ready() when scene tree is available
	pass

func _ready():
	# Find debug manager in the scene tree
	if get_tree() and get_tree().root:
		_debug_manager = get_tree().root.find_child("DebugManager", true, false)
		if not _debug_manager:
			print("Warning: DebugManager not found, using fallback logging")
	else:
		print("Warning: Scene tree not available, using fallback logging")

func process_command(client_id: int, command_type: String, params: Dictionary, command_id: String) -> bool:
	match command_type:
		"get_project_info":
			_get_project_info(client_id, params, command_id)
			return true
		"list_project_files":
			_list_project_files(client_id, params, command_id)
			return true
		"get_project_structure":
			_get_project_structure(client_id, params, command_id)
			return true
		"get_project_settings":
			_get_project_settings(client_id, params, command_id)
			return true
		"list_project_resources":
			_list_project_resources(client_id, params, command_id)
			return true
		"get_performance_metrics":
			_get_performance_metrics(client_id, params, command_id)
			return true
		# New project management commands to replace CLI tools
		"run_project":
			_run_project(client_id, params, command_id)
			return true
		"launch_editor":
			_launch_editor(client_id, params, command_id)
			return true
		"get_debug_output":
			_get_debug_output(client_id, params, command_id)
			return true
		"stop_project":
			_stop_project(client_id, params, command_id)
			return true
		"get_godot_version":
			_get_godot_version(client_id, params, command_id)
			return true
		"list_projects":
			_list_projects(client_id, params, command_id)
			return true
		"health_check":
			_health_check(client_id, params, command_id)
			return true
		"quick_setup":
			_quick_setup(client_id, params, command_id)
			return true
	return false  # Command not handled

func _get_project_info(client_id: int, _params: Dictionary, command_id: String) -> void:
	var project_name = ProjectSettings.get_setting("application/config/name", "Untitled Project")
	var project_version = ProjectSettings.get_setting("application/config/version", "1.0.0")
	var project_path = ProjectSettings.globalize_path("res://")
	
	# Get Godot version info and structure it as expected by the server
	var version_info = Engine.get_version_info()
	
	# Create structured version object with the expected properties
	var structured_version = {
		"major": version_info.get("major", 0),
		"minor": version_info.get("minor", 0),
		"patch": version_info.get("patch", 0)
	}
	
	_send_success(client_id, {
		"project_name": project_name,
		"project_version": project_version,
		"project_path": project_path,
		"godot_version": structured_version,
		"current_scene": get_tree().edited_scene_root.scene_file_path if (get_tree() and get_tree().edited_scene_root) else ""
	}, command_id)

func _list_project_files(client_id: int, params: Dictionary, command_id: String) -> void:
	var extensions = params.get("extensions", [])
	var files = []
	
	# Get all files with the specified extensions
	var dir = DirAccess.open("res://")
	if dir:
		_scan_directory(dir, "", extensions, files)
	else:
		return _send_error(client_id, "Failed to open res:// directory", command_id)
	
	_send_success(client_id, {
		"files": files
	}, command_id)

func _scan_directory(dir: DirAccess, path: String, extensions: Array, files: Array) -> void:
	dir.list_dir_begin()
	var file_name = dir.get_next()
	
	while file_name != "":
		if dir.current_is_dir():
			var subdir = DirAccess.open("res://" + path + file_name)
			if subdir:
				_scan_directory(subdir, path + file_name + "/", extensions, files)
		else:
			var file_path = path + file_name
			var has_valid_extension = extensions.is_empty()
			
			for ext in extensions:
				if file_name.ends_with(ext):
					has_valid_extension = true
					break
			
			if has_valid_extension:
				files.append("res://" + file_path)
		
		file_name = dir.get_next()
	
	dir.list_dir_end()

func _get_project_structure(client_id: int, params: Dictionary, command_id: String) -> void:
	var structure = {
		"directories": [],
		"file_counts": {},
		"total_files": 0
	}
	
	var dir = DirAccess.open("res://")
	if dir:
		_analyze_project_structure(dir, "", structure)
	else:
		return _send_error(client_id, "Failed to open res:// directory", command_id)
	
	_send_success(client_id, structure, command_id)

func _analyze_project_structure(dir: DirAccess, path: String, structure: Dictionary) -> void:
	dir.list_dir_begin()
	var file_name = dir.get_next()
	
	while file_name != "":
		if dir.current_is_dir():
			var dir_path = path + file_name + "/"
			structure["directories"].append("res://" + dir_path)
			
			var subdir = DirAccess.open("res://" + dir_path)
			if subdir:
				_analyze_project_structure(subdir, dir_path, structure)
		else:
			structure["total_files"] += 1
			
			var extension = file_name.get_extension()
			if extension in structure["file_counts"]:
				structure["file_counts"][extension] += 1
			else:
				structure["file_counts"][extension] = 1
		
		file_name = dir.get_next()

	dir.list_dir_end()

func _get_performance_metrics(client_id: int, params: Dictionary, command_id: String) -> void:
	var include_system_info = params.get("include_system_info", false)

	var metrics = {
		"fps": Performance.get_monitor(Performance.TIME_FPS),
		"frame_time": Performance.get_monitor(Performance.TIME_PROCESS) * 1000, # Convert to milliseconds
		"memory_usage": Performance.get_monitor(Performance.MEMORY_STATIC),
		"draw_calls": Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),
		"objects_drawn": Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME),
		"vertices_drawn": Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME)
	}

	# Add system info if requested
	if include_system_info:
		var system_info = {
			"os_name": OS.get_name(),
			"os_version": OS.get_version(),
			"processor_count": OS.get_processor_count(),
			"processor_name": OS.get_processor_name(),
			"video_adapter_name": RenderingServer.get_video_adapter_name(),
			"video_adapter_vendor": RenderingServer.get_video_adapter_vendor(),
			"video_adapter_type": RenderingServer.get_video_adapter_type(),
			"video_adapter_api_version": RenderingServer.get_video_adapter_api_version()
		}
		metrics["system_info"] = system_info

	_send_success(client_id, metrics, command_id)

func _get_project_settings(client_id: int, params: Dictionary, command_id: String) -> void:
	# Get relevant project settings
	var settings = {
		"project_name": ProjectSettings.get_setting("application/config/name", "Untitled Project"),
		"project_version": ProjectSettings.get_setting("application/config/version", "1.0.0"),
		"display": {
			"width": ProjectSettings.get_setting("display/window/size/viewport_width", 1024),
			"height": ProjectSettings.get_setting("display/window/size/viewport_height", 600),
			"mode": ProjectSettings.get_setting("display/window/size/mode", 0),
			"resizable": ProjectSettings.get_setting("display/window/size/resizable", true)
		},
		"physics": {
			"2d": {
				"default_gravity": ProjectSettings.get_setting("physics/2d/default_gravity", 980)
			},
			"3d": {
				"default_gravity": ProjectSettings.get_setting("physics/3d/default_gravity", 9.8)
			}
		},
		"rendering": {
			"quality": {
				"msaa": ProjectSettings.get_setting("rendering/anti_aliasing/quality/msaa_2d", 0)
			}
		},
		"input_map": {}
	}
	
	# Get input mappings
	var input_map = ProjectSettings.get_setting("input")
	if input_map:
		settings["input_map"] = input_map
	
	_send_success(client_id, settings, command_id)

func _list_project_resources(client_id: int, params: Dictionary, command_id: String) -> void:
	var resources = {
		"scenes": [],
		"scripts": [],
		"textures": [],
		"audio": [],
		"models": [],
		"resources": []
	}
	
	var dir = DirAccess.open("res://")
	if dir:
		_scan_resources(dir, "", resources)
	else:
		return _send_error(client_id, "Failed to open res:// directory", command_id)
	
	_send_success(client_id, resources, command_id)

func _scan_resources(dir: DirAccess, path: String, resources: Dictionary) -> void:
	dir.list_dir_begin()
	var file_name = dir.get_next()

	while file_name != "":
		if dir.current_is_dir():
			var subdir = DirAccess.open("res://" + path + file_name)
			if subdir:
				_scan_resources(subdir, path + file_name + "/", resources)
		else:
			var file_path = "res://" + path + file_name

			# Categorize by extension
			if file_name.ends_with(".tscn") or file_name.ends_with(".scn"):
				resources["scenes"].append(file_path)
			elif file_name.ends_with(".gd") or file_name.ends_with(".cs"):
				resources["scripts"].append(file_path)
			elif file_name.ends_with(".png") or file_name.ends_with(".jpg") or file_name.ends_with(".jpeg"):
				resources["textures"].append(file_path)
			elif file_name.ends_with(".wav") or file_name.ends_with(".ogg") or file_name.ends_with(".mp3"):
				resources["audio"].append(file_path)
			elif file_name.ends_with(".obj") or file_name.ends_with(".glb") or file_name.ends_with(".gltf"):
				resources["models"].append(file_path)
			elif file_name.ends_with(".tres") or file_name.ends_with(".res"):
				resources["resources"].append(file_path)

		file_name = dir.get_next()

	dir.list_dir_end()

# New project management command implementations

func _run_project(client_id: int, params: Dictionary, command_id: String) -> void:
	if _debug_manager:
		_debug_manager.log_command("run_project", params, command_id, "project_commands")

	var project_path = params.get("projectPath", "")
	var scene_path = params.get("scene", "")

	if project_path.is_empty():
		if _debug_manager:
			_debug_manager.error("projectPath is required", "project_commands", {"command_id": command_id})
		_send_error(client_id, "projectPath is required", command_id)
		return

	# Normalize project path - handle common mistakes
	if project_path.begins_with("/home/") or project_path.begins_with("/Users/"):
		# User provided absolute path - try to convert to relative or check if it's the current project
		var current_project_path = ProjectSettings.globalize_path("res://").get_base_dir()
		if project_path == current_project_path:
			project_path = "."  # Use current directory
		else:
			if _debug_manager:
				_debug_manager.error("Absolute paths not supported", "project_commands", {
					"provided_path": project_path,
					"current_project": current_project_path,
					"command_id": command_id
				})
			_send_error(client_id, "Absolute paths are not supported. Use '.' for current project or relative paths. Current project is at: " + current_project_path, command_id)
			return

	# Handle "." as current directory
	if project_path == ".":
		project_path = ProjectSettings.globalize_path("res://").get_base_dir()

	# Validate project exists
	var project_file = project_path + "/project.godot"
	if not FileAccess.file_exists(project_file):
		var suggestion = ""
		if FileAccess.file_exists("res://project.godot"):
			suggestion = " Did you mean '.' for the current project?"
		if _debug_manager:
			_debug_manager.error("Invalid project path", "project_commands", {
				"project_path": project_path,
				"project_file": project_file,
				"command_id": command_id
			})
		_send_error(client_id, "Not a valid Godot project: " + project_path + ". Make sure project.godot exists." + suggestion, command_id)
		return

	# Build command arguments
	var args = ["-d", "--path", project_path]
	if not scene_path.is_empty():
		args.append(scene_path)

	if _debug_manager:
		_debug_manager.debug("Starting Godot process", "project_commands", {
			"command": "godot",
			"args": args,
			"project_path": project_path,
			"scene_path": scene_path,
			"command_id": command_id
		})

	# Send immediate response to prevent MCP client timeout
	if _debug_manager:
		_debug_manager.info("Sending immediate response to MCP client", "project_commands", {
			"project_path": project_path,
			"scene_path": scene_path,
			"command_id": command_id
		})

	_send_success(client_id, {
		"message": "Godot project starting in debug mode...",
		"projectPath": project_path,
		"scene": scene_path,
		"status": "starting"
	}, command_id)

	# Execute Godot in background (non-blocking) after sending response
	call_deferred("_execute_godot_async", args, project_path, scene_path, command_id)

func _launch_editor(client_id: int, params: Dictionary, command_id: String) -> void:
	if _debug_manager:
		_debug_manager.log_command("launch_editor", params, command_id, "project_commands")

	var project_path = params.get("projectPath", "")
	var wait_for_ready = params.get("waitForReady", false)

	if project_path.is_empty():
		if _debug_manager:
			_debug_manager.error("projectPath is required", "project_commands", {"command_id": command_id})
		_send_error(client_id, "projectPath is required", command_id)
		return

	# Validate project exists
	var project_file = project_path + "/project.godot"
	if not FileAccess.file_exists(project_file):
		if _debug_manager:
			_debug_manager.error("Invalid project path", "project_commands", {
				"project_path": project_path,
				"project_file": project_file,
				"command_id": command_id
			})
		_send_error(client_id, "Not a valid Godot project: " + project_path, command_id)
		return

	# Send immediate response to prevent MCP client timeout
	if _debug_manager:
		_debug_manager.info("Sending immediate response to MCP client", "project_commands", {
			"project_path": project_path,
			"wait_for_ready": wait_for_ready,
			"command_id": command_id
		})

	var message = "Godot editor launching for project at " + project_path
	if wait_for_ready:
		message += ". Editor will be ready for use."

	_send_success(client_id, {
		"message": message,
		"projectPath": project_path,
		"status": "launching"
	}, command_id)

	# Launch Godot editor in background (non-blocking) after sending response
	call_deferred("_execute_godot_editor_async", ["-e", "--path", project_path], project_path, wait_for_ready, command_id)

func _get_debug_output(client_id: int, params: Dictionary, command_id: String) -> void:
	var lines = params.get("lines", 50)
	var filter_type = params.get("filter_type", "all")
	var include_timestamps = params.get("include_timestamps", true)
	var search_pattern = params.get("search_pattern", "")

	print("DEBUG: _get_debug_output called with params: ", params)

	# Get debug manager for comprehensive logging
	var debug_manager = _get_debug_manager()
	var debug_output = []

	if debug_manager:
		print("DEBUG: Found debug manager, collecting logs...")
		# Get recent debug logs from the debug manager
		debug_output = _collect_debug_logs(debug_manager, lines, filter_type, search_pattern)
		print("DEBUG: Collected ", debug_output.size(), " log entries")
	else:
		print("DEBUG: No debug manager found, using fallback...")
		# Fallback: collect basic Godot output
		debug_output = _collect_basic_debug_output(lines)

	# Add system information
	var system_info = {
		"godot_version": Engine.get_version_info(),
		"platform": OS.get_name(),
		"processor_count": OS.get_processor_count(),
		"memory_usage": Performance.get_monitor(Performance.MEMORY_STATIC),
		"fps": Performance.get_monitor(Performance.TIME_FPS)
	}

	# Add process information if available
	var process_info = _get_process_info()

	var result = {
		"debug_output": debug_output,
		"system_info": system_info,
		"process_info": process_info,
		"timestamp": Time.get_datetime_string_from_system(),
		"lines_requested": lines,
		"filter_applied": filter_type,
		"total_lines_returned": debug_output.size()
	}

	_send_success(client_id, result, command_id)

func _stop_project(client_id: int, params: Dictionary, command_id: String) -> void:
	# For now, return a placeholder since we don't have active process tracking
	_send_success(client_id, {
		"message": "Project stopping not yet implemented in unified architecture",
		"note": "This will be implemented when process lifecycle management is added"
	}, command_id)

func _get_godot_version(client_id: int, params: Dictionary, command_id: String) -> void:
	var version_info = Engine.get_version_info()
	var version_string = str(version_info.major) + "." + str(version_info.minor)
	if version_info.patch > 0:
		version_string += "." + str(version_info.patch)

	_send_success(client_id, {
		"version": version_string,
		"versionInfo": version_info
	}, command_id)

func _list_projects(client_id: int, params: Dictionary, command_id: String) -> void:
	var directory = params.get("directory", "")
	var recursive = params.get("recursive", false)

	if directory.is_empty():
		_send_error(client_id, "directory is required", command_id)
		return

	if not DirAccess.dir_exists_absolute(directory):
		_send_error(client_id, "Directory does not exist: " + directory, command_id)
		return

	var projects = _find_godot_projects(directory, recursive)
	_send_success(client_id, projects, command_id)

func _find_godot_projects(directory: String, recursive: bool) -> Array:
	var projects = []

	var dir = DirAccess.open(directory)
	if not dir:
		return projects

	# Check if current directory is a project
	var project_file = directory + "/project.godot"
	if FileAccess.file_exists(project_file):
		projects.append({
			"path": directory,
			"name": directory.get_file()
		})

	if not recursive:
		# Check immediate subdirectories
		dir.list_dir_begin()
		var file_name = dir.get_next()
		while file_name != "":
			if dir.current_is_dir():
				var subdir_path = directory + "/" + file_name
				var sub_project_file = subdir_path + "/project.godot"
				if FileAccess.file_exists(sub_project_file):
					projects.append({
						"path": subdir_path,
						"name": file_name
					})
			file_name = dir.get_next()
		dir.list_dir_end()
	else:
		# Recursive search
		dir.list_dir_begin()
		var file_name = dir.get_next()
		while file_name != "":
			if dir.current_is_dir() and not file_name.begins_with("."):
				var subdir_path = directory + "/" + file_name
				var sub_projects = _find_godot_projects(subdir_path, true)
				projects.append_array(sub_projects)
			file_name = dir.get_next()
		dir.list_dir_end()

	return projects

func _health_check(client_id: int, params: Dictionary, command_id: String) -> void:
	var project_path = params.get("projectPath", "")

	if project_path.is_empty():
		_send_error(client_id, "projectPath is required", command_id)
		return

	var health_report = {
		"projectExists": false,
		"projectFileValid": false,
		"resources": {},
		"warnings": [],
		"errors": []
	}

	# Check if project exists
	var project_file = project_path + "/project.godot"
	if FileAccess.file_exists(project_file):
		health_report.projectExists = true

		# Try to read project file
		var file = FileAccess.open(project_file, FileAccess.READ)
		if file:
			health_report.projectFileValid = true
			file.close()
		else:
			health_report.errors.append("Cannot read project.godot file")
	else:
		health_report.errors.append("project.godot file not found")

	_send_success(client_id, health_report, command_id)

## Asynchronous Godot execution helper
func _execute_godot_async(args: Array, project_path: String, scene_path: String, command_id: String) -> void:
	if _debug_manager:
		_debug_manager.debug("Executing Godot asynchronously", "project_commands", {
			"args": args,
			"project_path": project_path,
			"scene_path": scene_path,
			"command_id": command_id
		})

	var start_time = Time.get_ticks_msec()
	var output = []
	var exit_code = OS.execute("godot", args, output, false, true)
	var execution_time = Time.get_ticks_msec() - start_time

	if _debug_manager:
		_debug_manager.debug("Async Godot execution result", "project_commands", {
			"exit_code": exit_code,
			"execution_time_ms": execution_time,
			"output": output,
			"command_id": command_id
		})

	if exit_code == 0:
		if _debug_manager:
			_debug_manager.info("Godot project started successfully (async)", "project_commands", {
				"project_path": project_path,
				"scene_path": scene_path,
				"execution_time_ms": execution_time,
				"command_id": command_id
			})
	else:
		if _debug_manager:
			_debug_manager.error("Failed to start Godot project (async)", "project_commands", {
				"exit_code": exit_code,
				"output": output,
				"project_path": project_path,
				"command_id": command_id
			})

## Asynchronous Godot editor execution helper
func _execute_godot_editor_async(args: Array, project_path: String, wait_for_ready: bool, command_id: String) -> void:
	if _debug_manager:
		_debug_manager.debug("Executing Godot editor asynchronously", "project_commands", {
			"args": args,
			"project_path": project_path,
			"wait_for_ready": wait_for_ready,
			"command_id": command_id
		})

	var start_time = Time.get_ticks_msec()
	var output = []
	var exit_code = OS.execute("godot", args, output, false, true)
	var execution_time = Time.get_ticks_msec() - start_time

	if _debug_manager:
		_debug_manager.debug("Async Godot editor execution result", "project_commands", {
			"exit_code": exit_code,
			"execution_time_ms": execution_time,
			"output": output,
			"command_id": command_id
		})

	if exit_code == 0:
		var message = "Godot editor launched successfully for project at " + project_path
		if wait_for_ready:
			message += ". Editor is ready for use."

		if _debug_manager:
			_debug_manager.info("Godot editor launched successfully (async)", "project_commands", {
				"project_path": project_path,
				"wait_for_ready": wait_for_ready,
				"execution_time_ms": execution_time,
				"command_id": command_id
			})
	else:
		if _debug_manager:
			_debug_manager.error("Failed to launch Godot editor (async)", "project_commands", {
				"exit_code": exit_code,
				"output": output,
				"project_path": project_path,
				"command_id": command_id
			})

func _quick_setup(client_id: int, params: Dictionary, command_id: String) -> void:
	var project_path = params.get("projectPath", "")
	var project_name = params.get("projectName", "")
	var template = params.get("template", "2d")
	var include_demo = params.get("includeDemo", true)

	if project_path.is_empty() or project_name.is_empty():
		_send_error(client_id, "projectPath and projectName are required", command_id)
		return

	# Create project directory
	var dir = DirAccess.open(project_path)
	if not dir:
		_send_error(client_id, "Cannot access project path: " + project_path, command_id)
		return

	dir.make_dir(project_name)
	var full_project_path = project_path + "/" + project_name

	# Create basic project structure
	var project_file_content = """[application]

config/name=""" + project_name + """
config/version="1.0.0"

[editor_plugins]

enabled=PackedStringArray("res://addons/godot_mcp/plugin.cfg")
"""

	var file = FileAccess.open(full_project_path + "/project.godot", FileAccess.WRITE)
	if file:
		file.store_string(project_file_content)
		file.close()

		_send_success(client_id, {
			"message": "Project created successfully",
			"projectPath": full_project_path,
			"template": template
		}, command_id)
	else:
		_send_error(client_id, "Failed to create project file", command_id)

## Debug Output Helper Functions

func _get_debug_manager():
	# Try to find debug manager in the scene tree
	if get_tree() and get_tree().root:
		var debug_manager = get_tree().root.find_child("DebugManager", true, false)
		if debug_manager:
			print("Found DebugManager by name: ", debug_manager)
			return debug_manager

	# Try to find it by class name
	for node in get_tree().root.get_children():
		if node.get_class() == "MCPDebugManager":
			print("Found DebugManager by class: ", node)
			return node

	print("DebugManager not found in scene tree")
	return null

func _collect_debug_logs(debug_manager, lines: int, filter_type: String, search_pattern: String) -> Array:
	var logs = []

	# Try to get real logs from debug manager
	if debug_manager and debug_manager.has_method("get_recent_logs"):
		logs = debug_manager.get_recent_logs(lines, filter_type, search_pattern)
	else:
		# Fallback to basic debug output
		logs = _collect_basic_debug_output(lines)

	return logs

func _collect_basic_debug_output(lines: int) -> Array:
	var logs = []

	# Collect recent Godot output (this is a simplified version)
	# In a full implementation, this would capture actual Godot console output

	# Add some basic system information
	logs.append({
		"timestamp": Time.get_datetime_string_from_system(),
		"level": "INFO",
		"message": "Godot Engine v" + str(Engine.get_version_info().major) + "." + str(Engine.get_version_info().minor),
		"source": "system"
	})

	logs.append({
		"timestamp": Time.get_datetime_string_from_system(),
		"level": "INFO",
		"message": "Platform: " + OS.get_name(),
		"source": "system"
	})

	logs.append({
		"timestamp": Time.get_datetime_string_from_system(),
		"level": "INFO",
		"message": "Memory usage: " + str(Performance.get_monitor(Performance.MEMORY_STATIC)) + " bytes",
		"source": "performance"
	})

	logs.append({
		"timestamp": Time.get_datetime_string_from_system(),
		"level": "INFO",
		"message": "FPS: " + str(Performance.get_monitor(Performance.TIME_FPS)),
		"source": "performance"
	})

	# Add scene information
	var current_scene = ""
	if get_tree() and get_tree().current_scene:
		current_scene = get_tree().current_scene.scene_file_path
		logs.append({
			"timestamp": Time.get_datetime_string_from_system(),
			"level": "INFO",
			"message": "Current scene: " + current_scene,
			"source": "scene"
		})

	# Add MCP-specific information
	logs.append({
		"timestamp": Time.get_datetime_string_from_system(),
		"level": "INFO",
		"message": "MCP Server active - processing commands",
		"source": "mcp"
	})

	# Limit to requested number of lines
	if logs.size() > lines:
		logs = logs.slice(logs.size() - lines, logs.size())

	return logs

func _get_process_info() -> Dictionary:
	var process_info = {
		"running_processes": [],
		"memory_info": {
			"static_memory": Performance.get_monitor(Performance.MEMORY_STATIC),
			"dynamic_memory": 0,  # Not available in current Godot version
			"max_memory": Performance.get_monitor(Performance.MEMORY_STATIC_MAX)
		},
		"performance": {
			"fps": Performance.get_monitor(Performance.TIME_FPS),
			"frame_time": Performance.get_monitor(Performance.TIME_PROCESS),
			"physics_time": Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS),
			"objects_drawn": Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME)
		}
	}

	# Add information about the current Godot process
	process_info.running_processes.append({
		"name": "Godot Editor",
		"type": "editor",
		"status": "running",
		"project": ProjectSettings.get_setting("application/config/name", "Unknown Project")
	})

	return process_info
