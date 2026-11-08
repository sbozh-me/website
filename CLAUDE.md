# Claude Code Guidelines

## Commit Strategy

- Use `/commit` for all commits (creates conventional commits with changelog)
- Use `/commit simple` for minor changes (subject line only)
- Keep commits atomic and meaningful - one logical change per commit
- Commit frequently as you complete each task

## Roadmap Discipline (strict)

`ROADMAP.md` is the source of truth for what gets built. Follow it, don't drift from it.

- **Before starting any feature**, check that it is listed under the current open version in `ROADMAP.md`. If it isn't, stop and ask the user whether to add it to the roadmap (and under which version) — do not build unlisted features.
- **Bug fixes and chores** don't need a roadmap entry, but they must not smuggle in new features.
- **When an item ships**, strike it through (`~~item~~`) in the same commit or the release that ships it.
- **Release only when the version's section is done.** `make minor` closes the open version: every item is struck through, or the leftover is explicitly moved to a later version with the user's OK. Mark the heading `~~x.y.0 - Name~~ ✅`.
- **Never rewrite completed sections** to match what happened later — the roadmap must be accurate going forward.
- If the open version has no items (`TBD`), ask the user what goes in it before starting feature work.

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
