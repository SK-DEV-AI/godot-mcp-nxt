@tool
class_name MCPScreenshotManager
extends Node

signal capture_completed(image_data: PackedByteArray, metadata: Dictionary)
signal capture_failed(error_message: String)

var _capture_thread: Thread
var _capture_mutex: Mutex
var _is_capturing: bool = false

func _ready():
	_capture_thread = Thread.new()
	_capture_mutex = Mutex.new()

func _exit_tree():
	if _capture_thread and _capture_thread.is_alive():
		_capture_thread.wait_to_finish()
	_capture_thread = null
	_capture_mutex = null

## Capture editor viewport screenshot
func capture_editor_viewport(format: String = "png", quality: int = 90) -> void:
	if _is_capturing:
		emit_signal("capture_failed", "Screenshot capture already in progress")
		return

	_capture_mutex.lock()
	_is_capturing = true
	_capture_mutex.unlock()

	# Get editor interface
	var plugin = Engine.get_meta("GodotMCPPlugin")
	if not plugin:
		_capture_mutex.lock()
		_is_capturing = false
		_capture_mutex.unlock()
		emit_signal("capture_failed", "GodotMCPPlugin not found in Engine metadata")
		return

	var editor_interface = plugin.get_editor_interface()

	# Try 3D viewport first (most common for editor screenshots)
	var viewport = editor_interface.get_editor_viewport_3d(0)
	if not viewport:
		# Fall back to 2D viewport
		viewport = editor_interface.get_editor_viewport_2d(0)

	if not viewport:
		_capture_mutex.lock()
		_is_capturing = false
		_capture_mutex.unlock()
		emit_signal("capture_failed", "Editor viewport not available")
		return

	# Capture on main thread (viewport access must be main thread only)
	_capture_on_main_thread(viewport, format, quality, "editor")

## Capture game viewport screenshot
func capture_game_viewport(format: String = "png", quality: int = 90) -> void:
	if _is_capturing:
		emit_signal("capture_failed", "Screenshot capture already in progress")
		return

	_capture_mutex.lock()
	_is_capturing = true
	_capture_mutex.unlock()

	# Get game viewport
	var viewport = get_viewport()
	if not viewport:
		_capture_mutex.lock()
		_is_capturing = false
		_capture_mutex.unlock()
		emit_signal("capture_failed", "Game viewport not available")
		return

	# Start threaded capture
	var thread_data = {
		"viewport": viewport,
		"format": format,
		"quality": quality,
		"source": "game"
	}

	if _capture_thread.start(_capture_worker.bind(thread_data)) != OK:
		_capture_mutex.lock()
		_is_capturing = false
		_capture_mutex.unlock()
		emit_signal("capture_failed", "Failed to start capture thread")

## Main thread capture function
func _capture_on_main_thread(viewport: Viewport, format: String, quality: int, source: String) -> void:
	# Get viewport texture (must be on main thread)
	var texture = viewport.get_texture()
	if not texture:
		_capture_mutex.lock()
		_is_capturing = false
		_capture_mutex.unlock()
		emit_signal("capture_failed", "Failed to get viewport texture")
		return

	# Get image from texture
	var image = texture.get_image()
	if not image:
		_capture_mutex.lock()
		_is_capturing = false
		_capture_mutex.unlock()
		emit_signal("capture_failed", "Failed to get image from texture")
		return

	# Encode based on format
	var image_data: PackedByteArray
	var mime_type: String

	if format == "png":
		image_data = image.save_png_to_buffer()
		mime_type = "image/png"
	elif format == "jpg" or format == "jpeg":
		image_data = image.save_jpg_to_buffer(float(quality) / 100.0)
		mime_type = "image/jpeg"
	else:
		_capture_mutex.lock()
		_is_capturing = false
		_capture_mutex.unlock()
		emit_signal("capture_failed", "Unsupported format: " + format)
		return

	if image_data.is_empty():
		_capture_mutex.lock()
		_is_capturing = false
		_capture_mutex.unlock()
		emit_signal("capture_failed", "Failed to encode image")
		return

	# Create metadata
	var metadata = {
		"format": format,
		"mime_type": mime_type,
		"width": image.get_width(),
		"height": image.get_height(),
		"size_bytes": image_data.size(),
		"source": source,
		"timestamp": Time.get_unix_time_from_system(),
		"quality": quality
	}

	_capture_mutex.lock()
	_is_capturing = false
	_capture_mutex.unlock()

	emit_signal("capture_completed", image_data, metadata)

## Worker function for threaded capture
func _capture_worker(thread_data: Dictionary) -> void:
	var viewport = thread_data.viewport
	var format = thread_data.format
	var quality = thread_data.quality
	var source = thread_data.source

	# Get viewport texture
	var texture = viewport.get_texture()
	if not texture:
		call_deferred("_on_capture_failed", "Failed to get viewport texture")
		return

	# Get image from texture
	var image = texture.get_image()
	if not image:
		call_deferred("_on_capture_failed", "Failed to get image from texture")
		return

	# Encode based on format
	var image_data: PackedByteArray
	var mime_type: String

	if format == "png":
		image_data = image.save_png_to_buffer()
		mime_type = "image/png"
	elif format == "jpg" or format == "jpeg":
		image_data = image.save_jpg_to_buffer(float(quality) / 100.0)
		mime_type = "image/jpeg"
	else:
		call_deferred("_on_capture_failed", "Unsupported format: " + format)
		return

	if image_data.is_empty():
		call_deferred("_on_capture_failed", "Failed to encode image")
		return

	# Create metadata
	var metadata = {
		"format": format,
		"mime_type": mime_type,
		"width": image.get_width(),
		"height": image.get_height(),
		"size_bytes": image_data.size(),
		"source": source,
		"timestamp": Time.get_unix_time_from_system(),
		"quality": quality
	}

	# Signal completion on main thread
	call_deferred("_on_capture_completed", image_data, metadata)

## Signal handlers (called on main thread)
func _on_capture_completed(image_data: PackedByteArray, metadata: Dictionary) -> void:
	_capture_mutex.lock()
	_is_capturing = false
	_capture_mutex.unlock()

	emit_signal("capture_completed", image_data, metadata)

func _on_capture_failed(error_message: String) -> void:
	_capture_mutex.lock()
	_is_capturing = false
	_capture_mutex.unlock()

	emit_signal("capture_failed", error_message)

## Check if capture is in progress
func is_capturing() -> bool:
	_capture_mutex.lock()
	var capturing = _is_capturing
	_capture_mutex.unlock()
	return capturing

## Get supported formats
func get_supported_formats() -> Array:
	return ["png", "jpg", "jpeg"]