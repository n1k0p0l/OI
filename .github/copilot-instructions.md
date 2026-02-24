# Copilot Instructions for OI Project

## Critical: Changelog Maintenance
**REQUIRED:** Every code change MUST be documented in the Changelog section at the bottom of [OI.md](../OI.md).

### Changelog Entry Format:
- Add new entries at the **top** of the Changelog section (newest first)
- Use date format: `### YYYY-MM-DD`
- Categorize with: `**Added:**`, `**Fixed:**`, `**Changed:**`, `**Removed:**`, `**Security:**`
- Be concise but descriptive

### Example:
```markdown
### 2026-02-24
- **Fixed:** MSAL initialization error - Added `await msalInstance.initialize()` in boot() function.
```

## Project Overview
- Single-page app for browsing OneDrive and rendering OI.md files
- OI stands for "Online Ideas"
- Stack: Vanilla JavaScript, MSAL.js, Microsoft Graph API, marked.js
- Client ID: 0d2b8a4f-7cf8-4544-82a1-0096d711d4af (public, safe to expose)
- Deployment: GitHub Pages at https://n1k0p0l.github.io/OI/

## Development Guidelines
- Keep code simple and maintainable
- Test changes before committing
- Always update OI.md changelog before pushing
- See [CONVENTIONS.md](../CONVENTIONS.md) for detailed guidelines
