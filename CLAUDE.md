# Claude Code Guidelines

## Commit Strategy

- Use `/commit` for all commits (creates conventional commits with changelog)
- Use `/commit simple` for minor changes (subject line only)
- Keep commits atomic and meaningful - one logical change per commit
- Commit frequently as you complete each task

## Release Workflow

After completing a feature or fix:

```bash
make patch   # Bug fixes, minor changes
make minor   # New features (requires 90% test coverage)
make major   # Breaking changes (requires 90% test coverage)
```

## Development Principles

- Write clean, testable code
- Add tests for new functionality in apps/
- Keep changes focused and reviewable
- Update CHANGELOG.md via release scripts, not manually

## UI Components

**Always use shadcn/ui components from `@sbozh/react-ui`** for consistent styling:

```tsx
// Import from react-ui package
import { Button } from "@sbozh/react-ui/components/ui/button";
import { Input } from "@sbozh/react-ui/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@sbozh/react-ui/components/ui/select";
```

Available components:
- Button, Input, Select - form controls
- Alert, Separator - layout/feedback
- Sonner (toast) - notifications

When a component doesn't exist in react-ui, add it from [shadcn/ui](https://ui.shadcn.com/docs/components) before using it.
