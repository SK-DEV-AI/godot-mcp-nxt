@tool
class_name PerformanceMonitor
extends PanelContainer

# Performance monitoring signals
signal metrics_updated(metrics: Dictionary)
signal performance_alert(metric_name: String, value: float, threshold: float)

# UI References
@onready var fps_value: Label = $VBoxContainer/ScrollContainer/MetricsContainer/FPSMonitor/FPSValue
@onready var memory_value: Label = $VBoxContainer/ScrollContainer/MetricsContainer/MemoryMonitor/MemoryValue
@onready var physics_value: Label = $VBoxContainer/ScrollContainer/MetricsContainer/PhysicsMonitor/PhysicsValue
@onready var render_value: Label = $VBoxContainer/ScrollContainer/MetricsContainer/RenderMonitor/RenderValue
@onready var custom_container: VBoxContainer = $VBoxContainer/ScrollContainer/MetricsContainer/CustomMetrics/CustomContainer
@onready var refresh_button: Button = $VBoxContainer/Header/RefreshButton
@onready var auto_refresh: CheckBox = $VBoxContainer/Footer/AutoRefresh
@onready var interval_spin: SpinBox = $VBoxContainer/Footer/IntervalSpin
@onready var export_button: Button = $VBoxContainer/Footer/ExportButton

# Performance monitoring variables
var update_timer: Timer
var custom_monitors: Dictionary = {}
var performance_history: Array = []
var max_history_size: int = 100
var alert_thresholds: Dictionary = {
	"fps": 30.0,
	"memory_mb": 500.0,
	"physics_ms": 16.0
}

func _ready() -> void:
	_setup_ui()
	_setup_timer()
	_connect_signals()
	_initialize_custom_monitors()
	_update_metrics()

func _setup_ui() -> void:
	# Configure UI elements
	refresh_button.tooltip_text = "Manually refresh performance metrics"
	auto_refresh.tooltip_text = "Automatically refresh metrics at set interval"
	export_button.tooltip_text = "Export performance data to CSV"

func _setup_timer() -> void:
	update_timer = Timer.new()
	update_timer.wait_time = interval_spin.value
	update_timer.one_shot = false
	update_timer.autostart = false
	add_child(update_timer)

func _connect_signals() -> void:
	refresh_button.connect("pressed", Callable(self, "_on_refresh_pressed"))
	auto_refresh.connect("toggled", Callable(self, "_on_auto_refresh_toggled"))
	interval_spin.connect("value_changed", Callable(self, "_on_interval_changed"))
	export_button.connect("pressed", Callable(self, "_on_export_pressed"))
	update_timer.connect("timeout", Callable(self, "_on_timer_timeout"))

func _initialize_custom_monitors() -> void:
	# Initialize built-in custom monitors
	Performance.add_custom_monitor("scene_complexity", Callable(self, "_get_scene_complexity"))
	Performance.add_custom_monitor("active_nodes", Callable(self, "_get_active_node_count"))
	Performance.add_custom_monitor("render_calls", Callable(self, "_get_render_call_count"))

func _update_metrics() -> void:
	var metrics = _collect_metrics()

	# Update UI
	_update_ui(metrics)

	# Store in history
	_store_metrics_history(metrics)

	# Check for alerts
	_check_alerts(metrics)

	# Emit signal
	metrics_updated.emit(metrics)

func _collect_metrics() -> Dictionary:
	var metrics = {}

	# Built-in Godot performance monitors
	metrics["fps"] = Performance.get_monitor(Performance.TIME_FPS)
	metrics["frame_time"] = Performance.get_monitor(Performance.TIME_PROCESS) * 1000.0  # Convert to ms
	metrics["physics_time"] = Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS) * 1000.0
	metrics["memory_static"] = Performance.get_monitor(Performance.MEMORY_STATIC) / 1024.0 / 1024.0  # Convert to MB
	metrics["memory_dynamic"] = Performance.get_monitor(Performance.MEMORY_DYNAMIC) / 1024.0 / 1024.0
	metrics["render_objects"] = Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME)
	metrics["render_draw_calls"] = Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)
	metrics["physics_2d_active"] = Performance.get_monitor(Performance.PHYSICS_2D_ACTIVE_OBJECTS)
	metrics["physics_3d_active"] = Performance.get_monitor(Performance.PHYSICS_3D_ACTIVE_OBJECTS)

	# Custom monitors
	metrics["scene_complexity"] = Performance.get_custom_monitor("scene_complexity")
	metrics["active_nodes"] = Performance.get_custom_monitor("active_nodes")
	metrics["render_calls"] = Performance.get_custom_monitor("render_calls")

	# Calculate derived metrics
	metrics["memory_total"] = metrics["memory_static"] + metrics["memory_dynamic"]
	metrics["physics_combined"] = metrics["physics_2d_active"] + metrics["physics_3d_active"]

	return metrics

func _update_ui(metrics: Dictionary) -> void:
	# Update built-in metrics
	fps_value.text = "%.1f" % metrics["fps"]
	memory_value.text = "%.1f MB" % metrics["memory_total"]
	physics_value.text = "%.2f ms" % metrics["physics_time"]
	render_value.text = "%d" % metrics["render_objects"]

	# Update custom metrics UI
	_update_custom_metrics_ui(metrics)

func _update_custom_metrics_ui(metrics: Dictionary) -> void:
	# Clear existing custom metrics
	for child in custom_container.get_children():
		child.queue_free()

	# Add custom metrics
	var custom_metrics = {
		"Scene Complexity": metrics["scene_complexity"],
		"Active Nodes": metrics["active_nodes"],
		"Render Calls": metrics["render_calls"],
		"Physics Objects": metrics["physics_combined"],
		"Frame Time": "%.2f ms" % metrics["frame_time"]
	}

	for metric_name in custom_metrics:
		var hbox = HBoxContainer.new()
		var label = Label.new()
		var value = Label.new()

		label.text = metric_name + ":"
		label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		value.text = str(custom_metrics[metric_name])
		value.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		value.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT

		hbox.add_child(label)
		hbox.add_child(value)
		custom_container.add_child(hbox)

func _store_metrics_history(metrics: Dictionary) -> void:
	performance_history.append({
		"timestamp": Time.get_unix_time_from_system(),
		"metrics": metrics.duplicate()
	})

	# Limit history size
	if performance_history.size() > max_history_size:
		performance_history.remove_at(0)

func _check_alerts(metrics: Dictionary) -> void:
	# Check FPS alert
	if metrics["fps"] < alert_thresholds["fps"]:
		performance_alert.emit("FPS", metrics["fps"], alert_thresholds["fps"])

	# Check memory alert
	if metrics["memory_total"] > alert_thresholds["memory_mb"]:
		performance_alert.emit("Memory", metrics["memory_total"], alert_thresholds["memory_mb"])

	# Check physics time alert
	if metrics["physics_time"] > alert_thresholds["physics_ms"]:
		performance_alert.emit("Physics Time", metrics["physics_time"], alert_thresholds["physics_ms"])

func _get_scene_complexity() -> int:
	var plugin = Engine.get_meta("GodotMCPPlugin")
	if not plugin:
		return 0

	var editor_interface = plugin.get_editor_interface()
	var edited_scene_root = editor_interface.get_edited_scene_root()

	if not edited_scene_root:
		return 0

	return _count_nodes_recursive(edited_scene_root)

func _get_active_node_count() -> int:
	var plugin = Engine.get_meta("GodotMCPPlugin")
	if not plugin:
		return 0

	var editor_interface = plugin.get_editor_interface()
	var edited_scene_root = editor_interface.get_edited_scene_root()

	if not edited_scene_root:
		return 0

	return _count_active_nodes_recursive(edited_scene_root)

func _get_render_call_count() -> int:
	# This is a simplified metric - in a real implementation,
	# you'd hook into Godot's rendering pipeline
	return Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)

func _count_nodes_recursive(node: Node) -> int:
	var count = 1
	for child in node.get_children():
		count += _count_nodes_recursive(child)
	return count

func _count_active_nodes_recursive(node: Node) -> int:
	var count = 1 if node.is_processing() or node.is_physics_processing() else 0
	for child in node.get_children():
		count += _count_active_nodes_recursive(child)
	return count

# Signal handlers
func _on_refresh_pressed() -> void:
	_update_metrics()

func _on_auto_refresh_toggled(enabled: bool) -> void:
	if enabled:
		update_timer.start()
	else:
		update_timer.stop()

func _on_interval_changed(value: float) -> void:
	update_timer.wait_time = value
	if auto_refresh.button_pressed:
		update_timer.start()

func _on_timer_timeout() -> void:
	_update_metrics()

func _on_export_pressed() -> void:
	_export_performance_data()

func _export_performance_data() -> void:
	var csv_content = "Timestamp,FPS,FrameTime,PhysicsTime,MemoryTotal,RenderObjects,SceneComplexity\n"

	for entry in performance_history:
		var timestamp = entry["timestamp"]
		var metrics = entry["metrics"]
		csv_content += "%.2f,%.1f,%.2f,%.2f,%.1f,%d,%d\n" % [
			timestamp,
			metrics["fps"],
			metrics["frame_time"],
			metrics["physics_time"],
			metrics["memory_total"],
			metrics["render_objects"],
			metrics["scene_complexity"]
		]

	var file_path = "user://performance_data_%d.csv" % Time.get_unix_time_from_system()
	var file = FileAccess.open(file_path, FileAccess.WRITE)
	if file:
		file.store_string(csv_content)
		file.close()
		print("Performance data exported to: ", file_path)
	else:
		push_error("Failed to export performance data")

# Public API
func get_current_metrics() -> Dictionary:
	return _collect_metrics()

func get_performance_history() -> Array:
	return performance_history.duplicate()

func set_alert_threshold(metric: String, threshold: float) -> void:
	alert_thresholds[metric] = threshold

func get_alert_thresholds() -> Dictionary:
	return alert_thresholds.duplicate()