@tool
class_name MCPFuzzyMatcher
extends Node

## Calculate Levenshtein distance between two strings
func levenshtein_distance(s1: String, s2: String) -> int:
	var costs = []
	for i in range(s1.length() + 1):
		costs.append(i)

	for i in range(1, s2.length() + 1):
		costs[0] = i
		var nw = i - 1

		for j in range(1, s1.length() + 1):
			var cj = min(
				costs[j] + 1,      # deletion
				costs[j - 1] + 1,  # insertion
				nw + (0 if s1[j - 1] == s2[i - 1] else 1)  # substitution
			)
			nw = costs[j]
			costs[j] = cj

	return costs[s1.length()]

## Find best matches for node names from available nodes
func find_node_matches(target_name: String, available_nodes: Array, max_results: int = 5) -> Dictionary:
	var matches = []

	# Validate input
	if target_name.is_empty():
		return {
			"success": false,
			"error": "Target name cannot be empty",
			"matches": []
		}

	if available_nodes.is_empty():
		return {
			"success": false,
			"error": "No available nodes to search",
			"matches": []
		}

	# Process each available node
	for node_info in available_nodes:
		if typeof(node_info) != TYPE_DICTIONARY:
			continue

		var node_name = node_info.get("name", "")
		if node_name.is_empty():
			continue

		# Calculate similarity
		var distance = levenshtein_distance(target_name.to_lower(), node_name.to_lower())
		var max_length = max(target_name.length(), node_name.length())
		var similarity = 1.0 - (float(distance) / max_length) if max_length > 0 else 0.0

		# Only include reasonably similar matches
		if similarity > 0.3:
			matches.append({
				"name": node_name,
				"path": node_info.get("path", ""),
				"type": node_info.get("type", "Unknown"),
				"similarity": similarity,
				"distance": distance,
				"confidence": _calculate_confidence(similarity, distance, target_name, node_name)
			})

	# Sort by confidence (highest first)
	matches.sort_custom(func(a, b): return a.confidence > b.confidence)

	# Limit results
	var limited_matches = matches.slice(0, max_results - 1)

	return {
		"success": true,
		"matches": limited_matches,
		"total_found": matches.size(),
		"target": target_name
	}

## Calculate confidence score for a match
func _calculate_confidence(similarity: float, distance: int, target: String, candidate: String) -> float:
	var confidence = similarity

	# Boost confidence for exact prefix matches
	if candidate.to_lower().begins_with(target.to_lower()):
		confidence += 0.2

	# Boost confidence for exact substring matches
	if target.to_lower() in candidate.to_lower():
		confidence += 0.1

	# Penalize for very short matches (likely false positives)
	if candidate.length() < 3:
		confidence -= 0.3

	# Penalize for very long distance
	if distance > target.length() / 2:
		confidence -= 0.2

	# Ensure confidence stays within bounds
	return clamp(confidence, 0.0, 1.0)

## Find best matches for scene paths
func find_scene_matches(target_path: String, available_scenes: Array, max_results: int = 5) -> Dictionary:
	var matches = []

	# Validate input
	if target_path.is_empty():
		return {
			"success": false,
			"error": "Target path cannot be empty",
			"matches": []
		}

	# Process each available scene
	for scene_info in available_scenes:
		if typeof(scene_info) != TYPE_DICTIONARY:
			continue

		var scene_path = scene_info.get("path", "")
		if scene_path.is_empty():
			continue

		# Calculate similarity
		var distance = levenshtein_distance(target_path.to_lower(), scene_path.to_lower())
		var max_length = max(target_path.length(), scene_path.length())
		var similarity = 1.0 - (float(distance) / max_length) if max_length > 0 else 0.0

		# Only include reasonably similar matches
		if similarity > 0.4:  # Higher threshold for paths
			matches.append({
				"path": scene_path,
				"name": scene_info.get("name", ""),
				"similarity": similarity,
				"distance": distance,
				"confidence": _calculate_path_confidence(similarity, distance, target_path, scene_path)
			})

	# Sort by confidence (highest first)
	matches.sort_custom(func(a, b): return a.confidence > b.confidence)

	# Limit results
	var limited_matches = matches.slice(0, max_results - 1)

	return {
		"success": true,
		"matches": limited_matches,
		"total_found": matches.size(),
		"target": target_path
	}

## Calculate confidence for path matches
func _calculate_path_confidence(similarity: float, distance: int, target: String, candidate: String) -> float:
	var confidence = similarity

	# Boost confidence for exact directory matches
	var target_dir = target.get_base_dir()
	var candidate_dir = candidate.get_base_dir()
	if target_dir == candidate_dir:
		confidence += 0.3

	# Boost confidence for same file extension
	var target_ext = target.get_extension()
	var candidate_ext = candidate.get_extension()
	if target_ext == candidate_ext:
		confidence += 0.2

	# Penalize for different file extensions
	if target_ext != candidate_ext and not target_ext.is_empty():
		confidence -= 0.2

	# Ensure confidence stays within bounds
	return clamp(confidence, 0.0, 1.0)

## Find best matches for script paths
func find_script_matches(target_path: String, available_scripts: Array, max_results: int = 5) -> Dictionary:
	var matches = []

	# Validate input
	if target_path.is_empty():
		return {
			"success": false,
			"error": "Target path cannot be empty",
			"matches": []
		}

	# Process each available script
	for script_info in available_scripts:
		if typeof(script_info) != TYPE_DICTIONARY:
			continue

		var script_path = script_info.get("path", "")
		if script_path.is_empty():
			continue

		# Calculate similarity
		var distance = levenshtein_distance(target_path.to_lower(), script_path.to_lower())
		var max_length = max(target_path.length(), script_path.length())
		var similarity = 1.0 - (float(distance) / max_length) if max_length > 0 else 0.0

		# Only include reasonably similar matches
		if similarity > 0.4:
			matches.append({
				"path": script_path,
				"class_name": script_info.get("class_name", ""),
				"similarity": similarity,
				"distance": distance,
				"confidence": _calculate_path_confidence(similarity, distance, target_path, script_path)
			})

	# Sort by confidence (highest first)
	matches.sort_custom(func(a, b): return a.confidence > b.confidence)

	# Limit results
	var limited_matches = matches.slice(0, max_results - 1)

	return {
		"success": true,
		"matches": limited_matches,
		"total_found": matches.size(),
		"target": target_path
	}

## Get suggestions for common Godot node types
func get_node_type_suggestions(partial_name: String, max_results: int = 5) -> Array:
	var common_node_types = [
		"Node", "Node2D", "Node3D", "Control", "Container",
		"Sprite2D", "Sprite3D", "Label", "Button", "Panel",
		"CharacterBody2D", "CharacterBody3D", "RigidBody2D", "RigidBody3D",
		"CollisionShape2D", "CollisionShape3D", "Area2D", "Area3D",
		"AnimationPlayer", "AnimationTree", "Timer", "HTTPRequest",
		"Camera2D", "Camera3D", "Light2D", "Light3D", "TileMap",
		"MeshInstance3D", "MultiMeshInstance3D", "Particles2D", "Particles3D"
	]

	var matches = []

	for node_type in common_node_types:
		if partial_name.is_empty() or partial_name.to_lower() in node_type.to_lower():
			var similarity = 1.0
			if not partial_name.is_empty():
				var distance = levenshtein_distance(partial_name.to_lower(), node_type.to_lower())
				var max_length = max(partial_name.length(), node_type.length())
				similarity = 1.0 - (float(distance) / max_length) if max_length > 0 else 0.0

			matches.append({
				"type": node_type,
				"similarity": similarity,
				"category": _categorize_node_type(node_type)
			})

	# Sort by similarity
	matches.sort_custom(func(a, b): return a.similarity > b.similarity)

	return matches.slice(0, max_results - 1)

## Categorize node types for better suggestions
func _categorize_node_type(node_type: String) -> String:
	if node_type.ends_with("2D"):
		return "2D"
	elif node_type.ends_with("3D"):
		return "3D"
	elif node_type in ["Control", "Container", "Label", "Button", "Panel"]:
		return "UI"
	elif node_type.begins_with("CharacterBody") or node_type.begins_with("RigidBody"):
		return "Physics"
	elif node_type.begins_with("Animation"):
		return "Animation"
	else:
		return "General"