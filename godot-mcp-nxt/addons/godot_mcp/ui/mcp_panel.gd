@tool
extends Control

var websocket_server = null  # Will be set dynamically
var status_label: Label
var port_input: SpinBox
var connection_count_label: Label
var log_text: TextEdit
var performance_monitor: Control
var tab_container: TabContainer

# Configuration UI elements
var auto_start_check: CheckBox
var debug_mode_check: CheckBox
var rate_limit_input: SpinBox
var audit_log_check: CheckBox
var save_config_button: Button
var notification_timer: Timer

func _ready():
	# Get UI references
	status_label = $VBoxContainer/HeaderContainer/StatusBadge/StatusLabel
	port_input = $VBoxContainer/MainContainer/LeftPanel/QuickStats/StatsGrid/PortSpinBox
	connection_count_label = $VBoxContainer/MainContainer/LeftPanel/QuickStats/StatsGrid/CountLabel
	log_text = $VBoxContainer/MainContainer/LeftPanel/TabContainer/Server/LogText
	tab_container = $VBoxContainer/MainContainer/LeftPanel/TabContainer

	# Connect signals
	port_input.value_changed.connect(_on_port_changed)

	# Initialize performance monitor
	_initialize_performance_monitor()

	# Initialize configuration UI
	_initialize_configuration_ui()

	# Setup notification system
	_setup_notifications()

	# Initial UI setup
	_update_ui()

## Public method to set server reference
func set_server(server_instance) -> void:
	websocket_server = server_instance
	_connect_server_signals()
	_update_initial_state()

func _connect_server_signals() -> void:
	if not websocket_server:
		return

	# Connect server signals
	websocket_server.connect("client_connected", Callable(self, "_on_client_connected"))
	websocket_server.connect("client_disconnected", Callable(self, "_on_client_disconnected"))

	# Note: command_received is emitted by the server, not a signal we can connect to directly
	# Commands are handled internally by the server

func _update_initial_state() -> void:
	if websocket_server and port_input:
		port_input.value = websocket_server.get_port()
		_update_ui()

func _update_ui():
	if not websocket_server:
		status_label.text = "Server: Not initialized"
		port_input.editable = true
		connection_count_label.text = "0"
		return

	var is_active = websocket_server.is_server_active()

	# Server status - automated, no manual control needed
	status_label.text = "Server: " + ("Running (Auto)" if is_active else "Stopped (Auto)")
	port_input.editable = not is_active  # Can only change port when stopped

	if is_active:
		connection_count_label.text = str(websocket_server.get_client_count())
	else:
		connection_count_label.text = "0"


func _on_port_changed(new_port: float):
	if websocket_server:
		websocket_server.set_config("port", int(new_port))
		_log_message("Port changed to " + str(int(new_port)) + " - restart Godot to apply")
		_show_notification("Port changed - restart Godot to apply", 3.0)

func _on_client_connected(client_id: int):
	_log_message("Client connected: " + str(client_id))
	_update_ui()

func _on_client_disconnected(client_id: int):
	_log_message("Client disconnected: " + str(client_id))
	_update_ui()

func _on_command_received(client_id: int, command: Dictionary):
	var command_type = command.get("type", "unknown")
	var command_id = command.get("commandId", "no-id")
	_log_message("Received command: " + command_type + " (ID: " + command_id + ") from client " + str(client_id))

func _initialize_performance_monitor():
	# Load and instantiate the performance monitor
	var performance_monitor_scene = load("res://addons/godot_mcp/ui/performance_monitor.tscn")
	if performance_monitor_scene:
		performance_monitor = performance_monitor_scene.instantiate()
		var performance_tab = $VBoxContainer/MainContainer/LeftPanel/TabContainer/Performance
		if performance_tab:
			performance_tab.add_child(performance_monitor)
			performance_monitor.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			performance_monitor.size_flags_vertical = Control.SIZE_EXPAND_FILL

			# Connect performance monitor signals
			performance_monitor.connect("metrics_updated", Callable(self, "_on_performance_metrics_updated"))
			performance_monitor.connect("performance_alert", Callable(self, "_on_performance_alert"))

			_log_message("Performance monitor initialized")
		else:
			_log_message("ERROR: Performance tab not found")
	else:
		_log_message("ERROR: Could not load performance monitor scene")

func _log_message(message: String):
	var timestamp = Time.get_datetime_string_from_system()
	log_text.text += "[" + timestamp + "] " + message + "\n"
	# Auto-scroll to bottom
	log_text.scroll_vertical = log_text.get_line_count()

func _on_performance_metrics_updated(metrics: Dictionary):
	# Log significant metric changes
	var fps = metrics.get("fps", 0)
	if fps < 30:
		_log_message("WARNING: Low FPS detected: %.1f" % fps)

func _on_performance_alert(metric_name: String, value: float, threshold: float):
	var alert_message = "PERFORMANCE ALERT: %s is %.2f (threshold: %.2f)" % [metric_name, value, threshold]
	_log_message(alert_message)

	# Show notification for critical alerts
	if metric_name == "FPS" and value < 20:
		_show_notification("Critical: Very low FPS detected!", 5.0)
	elif metric_name == "Memory" and value > 800:
		_show_notification("Warning: High memory usage!", 3.0)

## Configuration UI Functions

func _initialize_configuration_ui():
	# Get references to the settings controls
	var settings_tab = $VBoxContainer/MainContainer/LeftPanel/TabContainer.get_node_or_null("Settings")
	if not settings_tab:
		_log_message("Settings tab not found")
		return

	auto_start_check = $VBoxContainer/MainContainer/LeftPanel/TabContainer/Settings/SettingsContainer/GeneralGroup/AutoStartCheck
	debug_mode_check = $VBoxContainer/MainContainer/LeftPanel/TabContainer/Settings/SettingsContainer/GeneralGroup/DebugModeCheck
	rate_limit_input = $VBoxContainer/MainContainer/LeftPanel/TabContainer/Settings/SettingsContainer/SecurityGroup/RateLimitContainer/RateLimitSpinBox
	audit_log_check = $VBoxContainer/MainContainer/LeftPanel/TabContainer/Settings/SettingsContainer/SecurityGroup/AuditLogCheck
	save_config_button = $VBoxContainer/MainContainer/LeftPanel/TabContainer/Settings/SettingsContainer/ActionsGroup/SaveButton

	# Connect signals
	if auto_start_check:
		auto_start_check.toggled.connect(_on_auto_start_toggled)
	if debug_mode_check:
		debug_mode_check.toggled.connect(_on_debug_mode_toggled)
	if rate_limit_input:
		rate_limit_input.value_changed.connect(_on_rate_limit_changed)
	if audit_log_check:
		audit_log_check.toggled.connect(_on_audit_log_toggled)
	if save_config_button:
		save_config_button.pressed.connect(_on_save_config_pressed)

	# Load current configuration
	_load_configuration_ui()

func _load_configuration_ui():
	if not websocket_server:
		return

	var config = websocket_server.get_config_dict()

	# Load all configuration options from USER_GUIDE.md
	if auto_start_check:
		auto_start_check.button_pressed = config.get("auto_start", false)
	if debug_mode_check:
		debug_mode_check.button_pressed = config.get("debug_mode", true)
	if rate_limit_input:
		rate_limit_input.value = config.get("rate_limit", 100)
	if audit_log_check:
		audit_log_check.button_pressed = config.get("audit_log", true)

	port_input.value = config.get("port", 9080)

func _on_auto_start_toggled(enabled: bool):
	if websocket_server:
		websocket_server.set_config("auto_start", enabled)
		_log_message("Auto-start " + ("enabled" if enabled else "disabled"))

func _on_debug_mode_toggled(enabled: bool):
	if websocket_server:
		websocket_server.set_config("debug_mode", enabled)
		_log_message("Debug mode " + ("enabled" if enabled else "disabled"))

func _on_rate_limit_changed(new_limit: float):
	if websocket_server:
		websocket_server.set_config("rate_limit", int(new_limit))
		_log_message("Rate limit set to " + str(int(new_limit)) + " requests/second")

func _on_audit_log_toggled(enabled: bool):
	if websocket_server:
		websocket_server.set_config("audit_log", enabled)
		_log_message("Audit logging " + ("enabled" if enabled else "disabled"))

func _on_save_config_pressed():
	if websocket_server:
		# Save all configuration options from USER_GUIDE.md
		websocket_server.set_config("port", int(port_input.value))
		websocket_server.set_config("auto_start", auto_start_check.button_pressed if auto_start_check else false)
		websocket_server.set_config("debug_mode", debug_mode_check.button_pressed if debug_mode_check else true)
		websocket_server.set_config("rate_limit", int(rate_limit_input.value) if rate_limit_input else 100)
		websocket_server.set_config("audit_log", audit_log_check.button_pressed if audit_log_check else true)

		_show_notification("Configuration saved successfully!", 2.0)
		_log_message("All configuration settings saved")

## Notification System

func _setup_notifications():
	notification_timer = Timer.new()
	notification_timer.one_shot = true
	add_child(notification_timer)
	notification_timer.timeout.connect(_hide_notification)

func _show_notification(message: String, duration: float = 3.0):
	# Create or update notification label
	var notification_label = get_node_or_null("NotificationLabel")
	if not notification_label:
		notification_label = Label.new()
		notification_label.name = "NotificationLabel"
		add_child(notification_label)

	notification_label.text = message
	notification_label.visible = true
	notification_label.modulate = Color(1, 0.8, 0.2, 1)  # Orange color for notifications

	# Position at top of panel
	notification_label.position = Vector2(10, 10)
	notification_label.size = Vector2(size.x - 20, 30)

	# Auto-hide after duration
	notification_timer.start(duration)

func _hide_notification():
	var notification_label = get_node_or_null("NotificationLabel")
	if notification_label:
		notification_label.visible = false

## Enhanced Error Recovery

func _handle_server_error(error_message: String):
	_log_message("ERROR: " + error_message)
	_show_notification("Server Error: " + error_message, 5.0)

	# Attempt automatic recovery for common issues
	if "port" in error_message.to_lower():
		_log_message("Attempting to recover by trying alternative port...")
		_try_alternative_port()
	elif "connection" in error_message.to_lower():
		_log_message("Attempting to restart server...")
		_attempt_server_restart()

func _try_alternative_port():
	if websocket_server:
		var current_port = websocket_server.get_port()
		var new_port = current_port + 1
		websocket_server.set_config("port", new_port)
		port_input.value = new_port
		_log_message("Port changed to " + str(new_port) + " - restart Godot to apply")

func _attempt_server_restart():
	_log_message("Server restart required - please restart Godot Editor")
	_show_notification("Please restart Godot Editor to apply changes", 5.0)