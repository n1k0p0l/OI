# Development Conventions

## Changelog Maintenance
**IMPORTANT:** All code changes must be documented in the Changelog section at the bottom of [README.md](README.md).

### Changelog Rules:
1. Add new entries at the **top** of the Changelog section (most recent first)
2. Use date format: `### YYYY-MM-DD`
3. Categorize changes with prefixes:
   - `**Added:**` - New features
   - `**Fixed:**` - Bug fixes
   - `**Changed:**` - Changes to existing functionality
   - `**Removed:**` - Removed features
   - `**Security:**` - Security-related changes
4. Be concise but descriptive - include what changed and why
5. Reference file names in backticks when relevant

### Example Entry:
```markdown
### 2026-02-24
- **Fixed:** MSAL initialization error - Added `await msalInstance.initialize()` in boot() function to resolve authentication failures.
```

## General Guidelines
- Keep the codebase simple and maintainable
- Document significant architectural decisions
- Test changes before committing
- Use meaningful commit messages that match changelog entries
