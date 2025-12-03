/# Claude Code Guidelines

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
