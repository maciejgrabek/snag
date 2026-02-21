# Snag — Visual Bug Tracker

Review and manage visual bug reports captured with Snag.

## Data Location

Issues are stored in `.snag/` in the current project root (automatically gitignored). Each issue is a pair of files:
- `YYYY-MM-DD-HHMMSS-slug.md` — markdown with title, status, tags, details
- `YYYY-MM-DD-HHMMSS-slug.png` — screenshot

## Commands

- `/snag` or `/snag list` — Show all open issues with screenshots
- `/snag all` — Show ALL issues (open + resolved)
- `/snag done <slug>` — Mark a specific issue as resolved
- `/snag done all` — Mark all open issues as resolved

## How to List Open Issues

1. Find all `.md` files in `.snag/` directory
2. Filter for files containing `**Status:** open`
3. For each open issue, display:
   - Title (from the `# heading`)
   - Captured date
   - Screenshot (read the matching `.png` file — the agent is multimodal and can display it)
4. If no open issues found, say "No open snag issues."

## How to Mark Issues as Resolved

Edit the `.md` file and change:
```
**Status:** open
```
to:
```
**Status:** resolved
```

## Guidelines

- **Always show the screenshot** — that's the whole point of snag. Use the Read tool on the `.png` file.
- **Keep output concise**: title + screenshot + one-line summary per issue.
- **After showing issues**, wait for user instructions on what to fix.
- **After fixing an issue**, proactively offer to mark it as resolved.
- **Sort by date** — oldest first (FIFO, work through them in order).

## Issue File Format

```markdown
# Short description of the bug

**Captured:** 2026-02-19T14:30:27.000Z
**Status:** open
**Tags:** css, mobile

![screenshot](2026-02-19-143027-short-description.png)

## Details

Optional longer description, steps to reproduce, expected behavior.

---
```

## Local API (Alternative)

If Snag is running, issues are also available via HTTP at `http://127.0.0.1:9999`:
- `GET /api/issues?project={cwd}&status=open` — list open issues
- `GET /api/issues/next?project={cwd}` — get next issue to work on
- `PATCH /api/issues/{id}` with body `{"project": "{cwd}", "status": "resolved"}` — mark as resolved

File-based access (reading `.snag/` directly) is preferred — it requires no running server and works with any agent.
