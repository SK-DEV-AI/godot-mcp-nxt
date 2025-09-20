@tool
class_name MCPDebugManager
extends Node

## Centralized debug logging system for Godot GDScript
## Controlled via ProjectSettings or environment variables

enum LogLevel {
	ERROR = 0,
	WARN = 1,
	INFO = 2,
	DEBUG = 3,
	TRACE = 4
}

# Current log level - can be controlled via ProjectSettings
var current_log_level: int = LogLevel.INFO

# Component filters - can enable/disable specific components
var component_filters: Dictionary = {}

# Performance timing
var _timers: Dictionary = {}

func _ready():
	# Initialize from ProjectSettings
	_initialize_from_settings()

	# Connect to project settings changes (Godot 4.5+)
	if Engine.has_singleton("ProjectSettings"):
		ProjectSettings.connect("settings_changed", Callable(self, "_on_settings_changed"))

func _initialize_from_settings():
	# Get log level from project settings
	var log_level_str = ProjectSettings.get_setting("godot_mcp/debug/log_level", "INFO")
	current_log_level = _string_to_log_level(log_level_str)

	# Get component filters
	var filters = ProjectSettings.get_setting("godot_mcp/debug/component_filters", "")
	if filters:
		for filter in filters.split(","):
			var parts = filter.strip_edges().split(":")
			if parts.size() == 2:
				component_filters[parts[0]] = parts[1].to_lower() == "true"

func _on_settings_changed():
	_initialize_from_settings()

func _string_to_log_level(level_str: String) -> int:
	match level_str.to_upper():
		"ERROR": return LogLevel.ERROR
		"WARN": return LogLevel.WARN
		"INFO": return LogLevel.INFO
		"DEBUG": return LogLevel.DEBUG
		"TRACE": return LogLevel.TRACE
		_: return LogLevel.INFO

func _should_log(level: int, component: String = "") -> bool:
	# Check global log level
	if level > current_log_level:
		return false

	# Check component filter if specified
	if component and component_filters.has(component):
		return component_filters[component]

	return true

func _format_message(level: String, component: String, message: String, context: Dictionary = {}) -> String:
	var timestamp = Time.get_datetime_string_from_system()
	var context_str = ""
	if context.size() > 0:
		context_str = " " + JSON.stringify(context)

	var component_str = "[" + component + "]" if component else ""

	return "[%s] %s %s%s%s" % [timestamp, level, component_str, message, context_str]

## Public logging methods

func error(message: String, component: String = "", context: Dictionary = {}):
	if _should_log(LogLevel.ERROR, component):
		var formatted = _format_message("ERROR", component, message, context)
		push_error(formatted)

func warn(message: String, component: String = "", context: Dictionary = {}):
	if _should_log(LogLevel.WARN, component):
		var formatted = _format_message("WARN", component, message, context)
		push_warning(formatted)

func info(message: String, component: String = "", context: Dictionary = {}):
	if _should_log(LogLevel.INFO, component):
		var formatted = _format_message("INFO", component, message, context)
		print(formatted)

func debug(message: String, component: String = "", context: Dictionary = {}):
	if _should_log(LogLevel.DEBUG, component):
		var formatted = _format_message("DEBUG", component, message, context)
		print(formatted)

func trace(message: String, component: String = "", context: Dictionary = {}):
	if _should_log(LogLevel.TRACE, component):
		var formatted = _format_message("TRACE", component, message, context)
		print(formatted)

## Performance timing methods

func start_timer(label: String, component: String = ""):
	_timers[label] = Time.get_ticks_msec()
	if _should_log(LogLevel.DEBUG, component):
		debug("Timer started: %s" % label, component)

func end_timer(label: String, component: String = "") -> float:
	if not _timers.has(label):
		warn("Timer '%s' was not started" % label, component)
		return 0.0

	var start_time = _timers[label]
	var duration = Time.get_ticks_msec() - start_time
	_timers.erase(label)

	if _should_log(LogLevel.DEBUG, component):
		debug("Timer ended: %s (%.2fms)" % [label, duration], component)

	return duration

## MCP-specific logging methods

func log_command(command_type: String, params: Dictionary, command_id: String, component: String = "command"):
	if _should_log(LogLevel.DEBUG, component):
		debug("Processing command: %s" % command_type, component, {
			"commandId": command_id,
			"params": _truncate_dict(params)
		})

func log_command_result(command_type: String, result: Dictionary, command_id: String, duration: float = 0.0, component: String = "command"):
	if _should_log(LogLevel.DEBUG, component):
		var context = {
			"commandId": command_id,
			"result": _truncate_dict(result)
		}
		if duration > 0:
			context["duration"] = "%.2fms" % duration

		debug("Command completed: %s" % command_type, component, context)

func log_command_error(command_type: String, error: String, command_id: String, component: String = "command"):
	error("Command failed: %s - %s" % [command_type, error], component, {
		"commandId": command_id
	})

## Utility methods

func _truncate_dict(dict: Dictionary, max_keys: int = 5) -> Dictionary:
	if dict.size() <= max_keys:
		return dict

	var truncated = {}
	var keys = dict.keys()
	for i in range(min(max_keys, keys.size())):
		truncated[keys[i]] = dict[keys[i]]

	truncated["_truncated"] = "%d more keys..." % (dict.size() - max_keys)
	return truncated

## Configuration methods

func set_log_level(level: int):
	current_log_level = level
	print("Debug log level set to: %d" % level)

func set_component_filter(component: String, enabled: bool):
	component_filters[component] = enabled
	print("Component filter %s set to: %s" % [component, enabled])

func get_log_level_name(level: int) -> String:
	match level:
		LogLevel.ERROR: return "ERROR"
		LogLevel.WARN: return "WARN"
		LogLevel.INFO: return "INFO"
		LogLevel.DEBUG: return "DEBUG"
		LogLevel.TRACE: return "TRACE"
		_: return "UNKNOWN"

## Singleton access

static func get_instance() -> MCPDebugManager:
	var tree = Engine.get_main_loop() if Engine.has_method("get_main_loop") else null
	if not tree:
		push_error("Cannot access debug manager - no main loop")
		return null

	# Try to find existing instance
	var existing = tree.root.find_child("MCPDebugManager", true, false)
	if existing:
		return existing

	# Create new instance
	var debug_manager = MCPDebugManager.new()
	debug_manager.name = "MCPDebugManager"
	tree.root.add_child(debug_manager)

	return debug_manager

## Convenience functions for global access

static func log_error(message: String, component: String = "", context: Dictionary = {}):
	var instance = get_instance()
	if instance:
		instance.error(message, component, context)

static func log_warn(message: String, component: String = "", context: Dictionary = {}):
	var instance = get_instance()
	if instance:
		instance.warn(message, component, context)

static func log_info(message: String, component: String = "", context: Dictionary = {}):
	var instance = get_instance()
	if instance:
		instance.info(message, component, context)

static func log_debug(message: String, component: String = "", context: Dictionary = {}):
	var instance = get_instance()
	if instance:
		instance.debug(message, component, context)

static func log_trace(message: String, component: String = "", context: Dictionary = {}):
	var instance = get_instance()
	if instance:
		instance.trace(message, component, context)