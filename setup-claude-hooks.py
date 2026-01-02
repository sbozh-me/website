#!/usr/bin/env python3
"""
Configure Claude Code hooks for Claude Cognitive system.
This adds hooks to ~/.claude/settings.json
"""

import json
from pathlib import Path

settings_file = Path.home() / ".claude/settings.json"

# Load existing or create new
if settings_file.exists():
    with open(settings_file) as f:
        settings = json.load(f)
    print("✓ Loaded existing settings")
else:
    settings = {}
    print("✓ Creating new settings file")

# Ensure hooks structure exists
if "hooks" not in settings:
    settings["hooks"] = {}

# Add UserPromptSubmit hooks
settings["hooks"]["UserPromptSubmit"] = [{
    "hooks": [
        {"type": "command", "command": "python3 ~/.claude/scripts/context-router-v2.py"},
        {"type": "command", "command": "python3 ~/.claude/scripts/pool-auto-update.py"}
    ]
}]

# Add SessionStart hook
settings["hooks"]["SessionStart"] = [{
    "hooks": [
        {"type": "command", "command": "python3 ~/.claude/scripts/pool-loader.py"}
    ]
}]

# Add Stop hook
settings["hooks"]["Stop"] = [{
    "hooks": [
        {"type": "command", "command": "python3 ~/.claude/scripts/pool-extractor.py"}
    ]
}]

# Write back
with open(settings_file, "w") as f:
    json.dump(settings, f, indent=2)

print("✓ Hooks configured successfully")
print("\nAdded hooks:")
print("  - UserPromptSubmit: context-router-v2.py + pool-auto-update.py")
print("  - SessionStart: pool-loader.py")
print("  - Stop: pool-extractor.py")