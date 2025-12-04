---
description: Create a conventional commit with ovidius [simple] [path]
---

Use the ovidius-commit-composer agent to create a conventional commit for staged changes.

Parameters can be provided in any order:

- "simple": Create simple commit with only subject line
- Path (e.g., "packages/ui" or "src/"): Stage only files from that directory before committing

Parameter handling:

1. If a path is provided (contains "/" or is a valid directory):
   - Stage all modified and untracked files from that directory using `git add <path>`
   - Then proceed with commit

2. If "simple" is provided, instruct ovidius to:
   - Create a commit with ONLY the subject line (type(scope): description)
   - NO changelog body
   - NO footer credits/attribution
   - Provide ONLY the commit hash when done - no explanations

3. If no parameters provided, use ovidius normally with full changelog and attribution

Examples:

- `/commit simple` - Simple commit of staged changes
- `/commit packages/ui` - Stage all files in packages/ui, then full commit
- `/commit simple packages/ui` - Stage packages/ui files, then simple commit
- `/commit` - Full commit of staged changes (ask to stage all changed files in none are staged)

IMPORTANT:
Do commit with --no-verify if wasnt asked otherwise
