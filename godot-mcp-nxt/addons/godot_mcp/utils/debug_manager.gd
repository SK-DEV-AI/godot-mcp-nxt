@tool
extends Node
class_name MCPDebugManager

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

# Log history for debug output
var _log_history: Array = []
var _max_log_history: int = 1000  # Keep last 1000 log entries

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

func _store_log_entry(level: String, component: String, message: String, context: Dictionary = {}):
	var log_entry = {
		"timestamp": Time.get_datetime_string_from_system(),
		"level": level,
		"component": component,
		"message": message,
		"context": context,
		"unix_time": Time.get_unix_time_from_system()
	}

	_log_history.append(log_entry)

	# Maintain max history size
	if _log_history.size() > _max_log_history:
		_log_history.remove_at(0)

## Public logging methods

func error(message: String, component: String = "", context: Dictionary = {}):
	_store_log_entry("ERROR", component, message, context)
	if _should_log(LogLevel.ERROR, component):
		var formatted = _format_message("ERROR", component, message, context)
		push_error(formatted)

func warn(message: String, component: String = "", context: Dictionary = {}):
	_store_log_entry("WARN", component, message, context)
	if _should_log(LogLevel.WARN, component):
		var formatted = _format_message("WARN", component, message, context)
		push_warning(formatted)

func info(message: String, component: String = "", context: Dictionary = {}):
	_store_log_entry("INFO", component, message, context)
	if _should_log(LogLevel.INFO, component):
		var formatted = _format_message("INFO", component, message, context)
		print(formatted)

func debug(message: String, component: String = "", context: Dictionary = {}):
	_store_log_entry("DEBUG", component, message, context)
	if _should_log(LogLevel.DEBUG, component):
		var formatted = _format_message("DEBUG", component, message, context)
		print(formatted)

func trace(message: String, component: String = "", context: Dictionary = {}):
	_store_log_entry("TRACE", component, message, context)
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
		var context = {
			"commandId": command_id,
			"params": _truncate_dict(params)
		}
		debug("Processing command: %s" % command_type, component, context)

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
	var context = {
		"commandId": command_id
	}
	error("Command failed: %s - %s" % [command_type, error], component, context)

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

## Log History Retrieval Methods

func get_recent_logs(lines: int = 50, filter_type: String = "all", search_pattern: String = "") -> Array:
	var filtered_logs = []

	# Start from the most recent logs
	var start_index = max(0, _log_history.size() - lines)

	for i in range(start_index, _log_history.size()):
		var log_entry = _log_history[i]
		var include_log = true

		# Apply type filtering
		if filter_type != "all":
			match filter_type:
				"errors":
					include_log = log_entry.level == "ERROR"
				"warnings":
					include_log = log_entry.level == "WARN"
				"info":
					include_log = log_entry.level == "INFO"

		# Apply search pattern filtering
		if include_log and not search_pattern.is_empty():
			include_log = search_pattern.to_lower() in log_entry.message.to_lower()

		if include_log:
			filtered_logs.append(log_entry)

	return filtered_logs

func get_logs_by_component(component: String, lines: int = 50) -> Array:
	var component_logs = []

	# Start from the most recent logs
	var start_index = max(0, _log_history.size() - lines * 2)  # Search more logs to find component matches

	for i in range(start_index, _log_history.size()):
		var log_entry = _log_history[i]
		if log_entry.component == component:
			component_logs.append(log_entry)
			if component_logs.size() >= lines:
				break

	return component_logs

func get_logs_since(timestamp: float) -> Array:
	var recent_logs = []

	for log_entry in _log_history:
		if log_entry.unix_time >= timestamp:
			recent_logs.append(log_entry)

	return recent_logs

func clear_log_history():
	_log_history.clear()
	print("Debug log history cleared")

func get_log_statistics() -> Dictionary:
	var stats = {
		"total_logs": _log_history.size(),
		"by_level": {},
		"by_component": {},
		"oldest_timestamp": "",
		"newest_timestamp": ""
	}

	if _log_history.size() > 0:
		stats.oldest_timestamp = _log_history[0].timestamp
		stats.newest_timestamp = _log_history[_log_history.size() - 1].timestamp

		for log_entry in _log_history:
			# Count by level
			var level = log_entry.level
			if stats.by_level.has(level):
				stats.by_level[level] += 1
			else:
				stats.by_level[level] = 1

			# Count by component
			var component = log_entry.component
			if component:
				if stats.by_component.has(component):
					stats.by_component[component] += 1
				else:
					stats.by_component[component] = 1

	return stats


## Convenience functions for global access

static func log_error(message: String, component: String = "", context: Dictionary = {}):
	_fallback_log("ERROR", component, message, context)

static func log_warn(message: String, component: String = "", context: Dictionary = {}):
	_fallback_log("WARN", component, message, context)

static func log_info(message: String, component: String = "", context: Dictionary = {}):
	_fallback_log("INFO", component, message, context)

static func log_debug(message: String, component: String = "", context: Dictionary = {}):
	_fallback_log("DEBUG", component, message, context)

static func log_trace(message: String, component: String = "", context: Dictionary = {}):
	_fallback_log("TRACE", component, message, context)


## Fallback logging when no instance is available
static func _fallback_log(level: String, component: String, message: String, context: Dictionary = {}):
	var timestamp = Time.get_datetime_string_from_system()
	var context_str = ""
	if context.size() > 0:
		context_str = " " + JSON.stringify(context)

	var component_str = "[" + component + "]" if component else ""

	var formatted = "[%s] %s %s%s%s" % [timestamp, level, component_str, message, context_str]
	print(formatted)
