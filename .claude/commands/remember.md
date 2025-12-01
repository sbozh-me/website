---
description: Lookup last conversation and continue where you left off
---

# Remember - Continue Previous Conversation

**EXECUTION INSTRUCTIONS:**

1. Use Bash to find the most recent todo file:
   ```bash
   ls -t ~/.claude/todos/*.json | head -1
   ```

2. Read that file using the Read tool

3. Parse the JSON and categorize todos by status:
   - `completed` - Tasks that were finished
   - `in_progress` - Tasks that were being worked on when interrupted
   - `pending` - Tasks that were planned but not started

4. Present a summary to the user in this format:

```
📋 Last Conversation Context:

Found [N] tasks from recent session:

✅ Completed ([N]):
- [Task 1]
- [Task 2]
...

⏳ In Progress ([N]):
- [Task 1]
...

⏸️ Pending ([N]):
- [Task 1]
- [Task 2]
...

What would you like to do?
```

5. Ask the user how they want to proceed:
   - Continue with in_progress/pending tasks?
   - Review what was completed?
   - Start something new?

6. If user wants to continue, use TodoWrite to restore the todo list from the file

## How to Use

```bash
/remember
```

## Example Output

```
📋 Last Conversation Context:

Found 8 tasks from recent session:

✅ Completed:
- Modify ovidius-reporter agent to use TodoWrite
- Add segmented report building workflow
- Add validation rules for Notion page linking
- Test updated agent with /docs-report command

⏳ In Progress:
- Create /remember slash command

⏸️ Pending:
- Implement logic to find last conversation
- Design continuation prompt format
- Test /remember command

Would you like to:
1. Continue with pending tasks?
2. Review completed work?
3. Start something new?
```

## When to Use This

- After restarting Claude Code
- When you forgot what you were working on
- To resume an interrupted conversation
- To see what was accomplished in the last session

## Technical Details

**Data Source**: `~/.claude/todos/*.json`
**Selection**: Most recently modified file
**Format**: JSON array of todo items with status

**Todo Status Values**:
- `completed` - Task finished
- `in_progress` - Currently working on
- `pending` - Not started yet
