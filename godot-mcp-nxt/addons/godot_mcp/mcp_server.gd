@tool
extends EditorPlugin

var tcp_server := TCPServer.new()
var port := 9080
var handshake_timeout := 3000 # ms
var debug_mode := true
var log_detailed := true  # Enable detailed logging
var command_handler = null  # Command handler reference

signal client_connected(id)
signal client_disconnected(id)
signal command_received(client_id, command)
signal metrics_updated(metrics: Dictionary)

class WebSocketClient:
	var tcp: StreamPeerTCP
	var id: int
	var ws: WebSocketPeer
	var state: int = -1 # -1: handshaking, 0: connected, 1: error/closed
	var handshake_time: int
	var last_poll_time: int
	
	func _init(p_tcp: StreamPeerTCP, p_id: int):
		tcp = p_tcp
		id = p_id
		handshake_time = Time.get_ticks_msec()
	
	func upgrade_to_websocket(headers: Dictionary = {}) -> bool:
		# Validate origin before upgrading
		if not headers.is_empty() and not validate_origin(headers):
			push_error("WebSocket connection rejected due to invalid origin")
			return false

		ws = WebSocketPeer.new()
		var err = ws.accept_stream(tcp)
		return err == OK

	func validate_origin(headers: Dictionary) -> bool:
		var origin = headers.get("Origin", "")
		var host = headers.get("Host", "")

		# Strict localhost validation (exact match only)
		if origin == "http://localhost" or origin == "http://localhost:3000" or origin == "http://127.0.0.1" or origin == "http://127.0.0.1:3000":
			return true

		# Allow same-origin connections (exact match)
		if host and origin == "http://" + host:
			return true

		# Allow specific trusted domains (exact match only)
		var trusted_domains = ["godot-mcp.dev", "localhost", "127.0.0.1"]
		for domain in trusted_domains:
			if origin == "http://" + domain or origin == "https://" + domain:
				return true

		push_warning("Rejected WebSocket connection from untrusted origin: %s (host: %s)" % [origin, host])
		return false

var clients := {}
var next_client_id := 1

## Rate limiting system
var _rate_limits := {}  # client_id -> {last_request_time, request_count, blocked_until}
var _rate_limit_max_requests := 100  # requests per minute
var _rate_limit_window := 60000  # 1 minute in milliseconds
var _rate_limit_block_duration := 300000  # 5 minutes block

# UI Panel reference
var mcp_panel: Control = null

# Configuration persistence
const CONFIG_FILE = "user://godot_mcp_config.json"
var _config = {
	"port": 9080,
	"auto_start": false,
	"debug_mode": true,
	"log_detailed": true,
	"rate_limit": 100,  # MCP_RATE_LIMIT from USER_GUIDE.md
	"audit_log": true   # MCP_AUDIT_LOG from USER_GUIDE.md
}

func _enter_tree():
	# Store plugin instance for EditorInterface access
	Engine.set_meta("GodotMCPPlugin", self)

	# Initialize debug manager
	var debug_manager = preload("res://addons/godot_mcp/utils/debug_manager.gd").new()
	debug_manager.name = "DebugManager"
	add_child(debug_manager)

	# Load configuration
	_load_config()

	MCPDebugManager.log_info("=== MCP SERVER STARTING ===", "server")

	# Initialize the command handler
	MCPDebugManager.log_info("Creating command handler...", "server")
	command_handler = preload("res://addons/godot_mcp/command_handler.gd").new()
	command_handler.name = "CommandHandler"
	add_child(command_handler)

	# Connect signals
	MCPDebugManager.log_info("Connecting command handler signals...", "server")
	self.connect("command_received", Callable(command_handler, "_handle_command"))

	# Initialize UI Panel
	MCPDebugManager.log_info("Initializing UI panel...", "server")
	_initialize_ui_panel()

	# Auto-start server if configured
	if _config.auto_start:
		MCPDebugManager.log_info("Auto-starting server...", "server")
		var err = tcp_server.listen(_config.port)
		if err == OK:
			MCPDebugManager.log_info("Listening on port %d" % _config.port, "server")
			set_process(true)
		else:
			MCPDebugManager.log_error("Failed to auto-start server on port %d, error: %d" % [_config.port, err], "server")
	else:
		MCPDebugManager.log_info("Server configured for manual start", "server")

	MCPDebugManager.log_info("=== MCP SERVER INITIALIZED ===", "server")

func _exit_tree():
	# Clean up UI panel
	if mcp_panel:
		remove_control_from_bottom_panel(mcp_panel)
		mcp_panel.queue_free()
		mcp_panel = null

	# Remove plugin instance from Engine metadata
	if Engine.has_meta("GodotMCPPlugin"):
		Engine.remove_meta("GodotMCPPlugin")

	if tcp_server and tcp_server.is_listening():
		tcp_server.stop()

	clients.clear()

	print("=== MCP SERVER SHUTDOWN ===")

func _log(client_id, message):
	if log_detailed:
		print("[Client ", client_id, "] ", message)

# Server metrics tracking
var _last_metrics_update := 0
var _metrics_update_interval := 1000  # Update every second
var _active_connections := 0
var _messages_per_second := 0.0
var _message_count := 0

func _process(_delta):
	if not tcp_server.is_listening():
		return

	# Update server metrics periodically
	var metrics_time = Time.get_ticks_msec()
	if metrics_time - _last_metrics_update > _metrics_update_interval:
		_update_server_metrics()
		_last_metrics_update = metrics_time

	# Poll for new connections
	if tcp_server.is_connection_available():
		var tcp = tcp_server.take_connection()
		var id = next_client_id
		next_client_id += 1
		
		var client = WebSocketClient.new(tcp, id)
		clients[id] = client
		
		print("[Client ", id, "] New TCP connection")
		
		# Try to upgrade immediately (headers will be validated during handshake)
		if client.upgrade_to_websocket():
			print("[Client ", id, "] WebSocket handshake started")
		else:
			print("[Client ", id, "] Failed to start WebSocket handshake")
			clients.erase(id)
	
	# Update clients
	var current_time = Time.get_ticks_msec()
	var ids_to_remove := []
	
	for id in clients:
		var client = clients[id]
		client.last_poll_time = current_time
		
		# Process client based on its state
		if client.state == -1: # Handshaking
			if client.ws != null:
				# Poll the WebSocket peer
				client.ws.poll()
				
				# Check WebSocket state
				var ws_state = client.ws.get_ready_state()
				if debug_mode:
					_log(id, "State: " + str(ws_state))
					
				if ws_state == WebSocketPeer.STATE_OPEN:
					print("[Client ", id, "] WebSocket handshake completed")
					client.state = 0
					
					# Emit connected signal
					emit_signal("client_connected", id)
					
					# Send welcome message
					var msg = JSON.stringify({
						"type": "welcome",
						"message": "Welcome to Godot MCP WebSocket Server"
					})
					client.ws.send_text(msg)
					
				elif ws_state != WebSocketPeer.STATE_CONNECTING:
					print("[Client ", id, "] WebSocket handshake failed, state: ", ws_state)
					ids_to_remove.append(id)
				
				# Check for handshake timeout
				elif current_time - client.handshake_time > handshake_timeout:
					print("[Client ", id, "] WebSocket handshake timed out")
					ids_to_remove.append(id)
			else:
				# If TCP is still connected, try upgrading
				if client.tcp.get_status() == StreamPeerTCP.STATUS_CONNECTED:
					# For now, upgrade without headers (will be validated during handshake)
					# TODO: Extract headers from WebSocket handshake for proper validation
					if client.upgrade_to_websocket():
						print("[Client ", id, "] WebSocket handshake started")
					else:
						print("[Client ", id, "] Failed to start WebSocket handshake")
						ids_to_remove.append(id)
				else:
					print("[Client ", id, "] TCP disconnected during handshake")
					ids_to_remove.append(id)
		
		elif client.state == 0: # Connected
			# Poll the WebSocket
			client.ws.poll()
			
			# Check state
			var ws_state = client.ws.get_ready_state()
			if ws_state != WebSocketPeer.STATE_OPEN:
				print("[Client ", id, "] WebSocket connection closed, state: ", ws_state)
				emit_signal("client_disconnected", id)
				ids_to_remove.append(id)
				continue
			
			# Process messages
			while client.ws.get_available_packet_count() > 0:
				var packet = client.ws.get_packet()
				var text = packet.get_string_from_utf8()

				# Security: Validate message size (max 1MB)
				if text.length() > 1024 * 1024:
					push_error("[Client %d] Message too large: %d bytes" % [id, text.length()])
					ids_to_remove.append(id)
					break

				# Security: Basic input sanitization
				if text.strip_edges().is_empty():
					continue

				print("[Client ", id, "] RECEIVED RAW DATA: ", text)

				# Parse as JSON with error handling
				var json = JSON.new()
				var parse_result = json.parse(text)
				_log(id, "JSON parse result: " + str(parse_result))
				
				if parse_result == OK:
					var data = json.get_data()
					_log(id, "Parsed JSON: " + str(data))
					
					# Handle JSON-RPC protocol
					if data.has("jsonrpc") and data.get("jsonrpc") == "2.0":
						# Handle ping method
						if data.has("method") and data.get("method") == "ping":
							print("[Client ", id, "] Received PING with id: ", data.get("id"))
							var response = {
								"jsonrpc": "2.0",
								"id": data.get("id"),
								"result": null  # FastMCP expects null result for pings
							}
							var response_text = JSON.stringify(response)
							var send_result = client.ws.send_text(response_text)
							print("[Client ", id, "] SENDING PING RESPONSE: ", response_text, " (result: ", send_result, ")")
						
						# Handle other MCP commands
						elif data.has("method"):
							var method_name = data.get("method")
							var params = data.get("params", {})
							var req_id = data.get("id")
							
							print("[Client ", id, "] Processing JSON-RPC method: ", method_name)
							
							# For now, just send a generic success response
							# TODO: Route these to command handler as well
							var response = {
								"jsonrpc": "2.0",
								"id": req_id,
								"result": {
									"status": "success",
									"message": "Command processed"
								}
							}
							
							var response_text = JSON.stringify(response)
							var send_result = client.ws.send_text(response_text)
							print("[Client ", id, "] SENT RESPONSE: ", response_text, " (result: ", send_result, ")")
					
					# Handle legacy command format - This is what Claude Code uses
					elif data.has("type"):
						var cmd_type = data.get("type")
						var params = data.get("params", {})
						var cmd_id = data.get("commandId", "")

						# Track message count for metrics
						_message_count += 1

						# Check rate limiting before processing command
						var rate_limit_check = _check_rate_limit(id)
						if not rate_limit_check.allowed:
							var error_response = {
								"status": "error",
								"message": rate_limit_check.reason,
								"retryAfter": rate_limit_check.retry_after,
								"commandId": cmd_id
							}
							client.ws.send_text(JSON.stringify(error_response))
							continue

						print("[Client ", id, "] Processing command: ", cmd_type)

						# Handle screenshot and fuzzy matching commands directly
						if cmd_type in ["capture_editor_screenshot", "capture_game_screenshot", "get_supported_screenshot_formats"]:
							_handle_screenshot_command(id, cmd_type, params, cmd_id)
						elif cmd_type in ["fuzzy_match_nodes", "fuzzy_match_scenes", "fuzzy_match_scripts"]:
							_handle_fuzzy_command(id, cmd_type, params, cmd_id)
						else:
							# Route other commands to command handler via signal
							emit_signal("command_received", id, data)
				else:
					print("[Client ", id, "] Failed to parse JSON: ", json.get_error_message())
	
	# Remove clients that need to be removed
	for id in ids_to_remove:
		clients.erase(id)

# Function for command handler to send responses back to clients
func send_response(client_id: int, response: Dictionary) -> int:
	if not clients.has(client_id):
		print("Error: Client %d not found" % client_id)
		return ERR_DOES_NOT_EXIST
	
	var client = clients[client_id]
	var json_text = JSON.stringify(response)
	
	print("Sending response to client %d: %s" % [client_id, json_text])
	
	if client.ws.get_ready_state() != WebSocketPeer.STATE_OPEN:
		print("Error: Client %d connection not open" % client_id)
		return ERR_UNAVAILABLE
	
	var result = client.ws.send_text(json_text)
	if result != OK:
		print("Error sending response to client %d: %d" % [client_id, result])
	
	return result

func is_server_active() -> bool:
	return tcp_server.is_listening()

func stop_server() -> void:
	if is_server_active():
		tcp_server.stop()
		clients.clear()
		print("MCP WebSocket server stopped")
		
func get_port() -> int:
	return port

## Handle screenshot commands
func _handle_screenshot_command(client_id: int, command_type: String, params: Dictionary, command_id: String) -> void:
	var command_handler = get_node("CommandHandler")
	if not command_handler:
		send_response(client_id, {
			"status": "error",
			"message": "Command handler not found",
			"commandId": command_id
		})
		return

	# Delegate to command handler
	command_handler._handle_screenshot_command(client_id, command_type, params, command_id)

## Handle fuzzy matching commands
func _handle_fuzzy_command(client_id: int, command_type: String, params: Dictionary, command_id: String) -> void:
	var command_handler = get_node("CommandHandler")
	if not command_handler:
		send_response(client_id, {
			"status": "error",
			"message": "Command handler not found",
			"commandId": command_id
		})
		return

	# Delegate to command handler
	command_handler._handle_fuzzy_command(client_id, command_type, params, command_id)

## Rate limiting functions
func _check_rate_limit(client_id: int) -> Dictionary:
	var current_time = Time.get_ticks_msec()

	if not _rate_limits.has(client_id):
		_rate_limits[client_id] = {
			"last_request_time": current_time,
			"request_count": 0,
			"blocked_until": 0
		}

	var client_limit = _rate_limits[client_id]

	# Check if client is currently blocked
	if current_time < client_limit.blocked_until:
		var remaining_block = client_limit.blocked_until - current_time
		return {
			"allowed": false,
			"reason": "Rate limit exceeded. Try again in %d seconds" % (remaining_block / 1000),
			"retry_after": remaining_block
		}

	# Reset counter if window has passed
	if current_time - client_limit.last_request_time > _rate_limit_window:
		client_limit.request_count = 0
		client_limit.last_request_time = current_time

	# Increment request count
	client_limit.request_count += 1

	# Check if limit exceeded
	if client_limit.request_count > _rate_limit_max_requests:
		client_limit.blocked_until = current_time + _rate_limit_block_duration
		push_warning("Client %d rate limit exceeded, blocking for %d seconds" % [client_id, _rate_limit_block_duration / 1000])
		return {
			"allowed": false,
			"reason": "Rate limit exceeded. Try again in %d seconds" % (_rate_limit_block_duration / 1000),
			"retry_after": _rate_limit_block_duration
		}

	return {"allowed": true}

func _cleanup_rate_limits() -> void:
	var current_time = Time.get_ticks_msec()
	var to_remove = []

	for client_id in _rate_limits.keys():
		var client_limit = _rate_limits[client_id]
		# Remove old entries that are no longer blocked and haven't been active recently
		if current_time > client_limit.blocked_until and current_time - client_limit.last_request_time > _rate_limit_window * 2:
			to_remove.append(client_id)

	for client_id in to_remove:
		_rate_limits.erase(client_id)

	if to_remove.size() > 0:
		print("Cleaned up rate limit data for %d inactive clients" % to_remove.size())

## Server Metrics Functions

func _update_server_metrics() -> void:
	# Calculate messages per second
	var time_diff = _metrics_update_interval / 1000.0  # Convert to seconds
	_messages_per_second = _message_count / time_diff
	_message_count = 0  # Reset counter

	# Update active connections count
	_active_connections = clients.size()

	# Emit metrics signal
	var metrics = {
		"active_connections": _active_connections,
		"messages_per_second": _messages_per_second,
		"server_status": "running" if is_server_active() else "stopped",
		"total_clients_connected": next_client_id - 1
	}

	emit_signal("metrics_updated", metrics)

## Configuration Management Functions

func _load_config() -> void:
	var file = FileAccess.open(CONFIG_FILE, FileAccess.READ)
	if file:
		var json_string = file.get_as_text()
		file.close()

		var json = JSON.new()
		var parse_result = json.parse(json_string)
		if parse_result == OK:
			var loaded_config = json.get_data()
			# Merge loaded config with defaults
			for key in _config.keys():
				if loaded_config.has(key):
					_config[key] = loaded_config[key]

		print("Configuration loaded from", CONFIG_FILE)
	else:
		print("No configuration file found, using defaults")
		_save_config()  # Create default config file

func _save_config() -> void:
	var json_string = JSON.stringify(_config, "\t")
	var file = FileAccess.open(CONFIG_FILE, FileAccess.WRITE)
	if file:
		file.store_string(json_string)
		file.close()
		print("Configuration saved to", CONFIG_FILE)
	else:
		push_error("Failed to save configuration to", CONFIG_FILE)

func set_config(key: String, value) -> void:
	if _config.has(key):
		_config[key] = value
		_save_config()

		# Apply configuration changes
		match key:
			"port":
				port = value
			"debug_mode":
				debug_mode = value
			"log_detailed":
				log_detailed = value

func get_config(key: String):
	return _config.get(key, null)

func get_config_dict() -> Dictionary:
	return _config.duplicate()

## UI Panel Integration Functions

func _initialize_ui_panel() -> void:
	# Load and instantiate the MCP panel scene
	var panel_scene = preload("res://addons/godot_mcp/ui/mcp_panel.tscn")
	if not panel_scene:
		push_error("Failed to load MCP panel scene")
		return

	mcp_panel = panel_scene.instantiate()
	if not mcp_panel:
		push_error("Failed to instantiate MCP panel")
		return

	# Set minimum size for proper display
	mcp_panel.custom_minimum_size = Vector2(600, 300)

	# Connect the panel to this server instance
	if mcp_panel.has_method("set_server"):
		mcp_panel.set_server(self)
	else:
		# Fallback: set server reference directly
		mcp_panel.websocket_server = self

	# Add to bottom panel
	add_control_to_bottom_panel(mcp_panel, "MCP Server")

	print("MCP UI panel initialized and added to bottom panel")
