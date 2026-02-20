# Snag

A visual bug capture tool for developers who work with AI agents and don't need a project management system that costs more than their rent.

## The Story

You're building something. You test in the browser. You see a bug. Now what?

**If you're a normal company**, you open Jira. You wait for Jira to load. You wait some more. You click "Create Issue." You fill out 14 fields, 11 of which are mandatory and 9 of which nobody will ever read. You attach a screenshot — but first you have to find it, because macOS saved it to the desktop with a name like `Screenshot 2026-02-19 at 14.30.27.png`. You write a description that you know will be interpreted differently by whoever picks it up. You assign it to a sprint. You set story points. You go back to coding and realize you've forgotten what you were doing. Total time: 3-5 minutes. Times 20-100 bugs a day. You start skipping screenshots. You start writing "see above" in descriptions. The bugs get worse.

**If you're using Trello**, same thing but with prettier colors and a vague sense of guilt about the 47 cards in your "Doing" column.

**If you're a solo developer working with AI agents**, none of this makes sense. Your "team" is you and Claude Code (or Cursor, or Copilot). You don't need sprints. You don't need story points. You don't need a standup. You need to get visual context from your browser into your project directory where your AI agent can actually see it. That's it.

Snag does exactly that. Nothing more.

## What About MCP?

We thought about it. MCP (Model Context Protocol) is great when your AI needs to *query* an external system bidirectionally — databases, APIs, live services. But this flow is one-directional: you see a bug in the browser, you want it on disk. MCP would mean writing a server, registering tool definitions that bloat your context on every message, and maintaining a protocol layer for what is essentially "save a file." It's like building a REST API to rename a folder.

## What About a Chrome Extension?

Also thought about it. Chrome extensions can't talk to Claude Code — they're completely separate sessions with no bridge. You'd need a Chrome extension *plus* a local HTTP server for the extension to write files to disk. Two moving pieces, locked to Chrome, and you still have to maintain the server. At that point you've reinvented Snag but worse.

## So What Does Snag Actually Do?

Screenshot (`Cmd+Shift+4`) → Hotkey (`Cmd+Shift+X`) → Type what's wrong → `Cmd+Enter`. Under 5 seconds. Done.

Snag reads the screenshot from your clipboard, shows a minimal form, and saves everything as plain Markdown + PNG into your project's `.snag/` directory:

```
my-project/
  .snag/
    2026-02-19-143027-button-overlaps-sidebar.md
    2026-02-19-143027-button-overlaps-sidebar.png
```

The `.md` file is self-contained and readable by anything:

```markdown
# Button overlaps sidebar on mobile

**Captured:** 2026-02-19T14:30:27.000Z
**Status:** open
**Tags:** css, mobile

![screenshot](2026-02-19-143027-button-overlaps-sidebar.png)

---

```

No proprietary format. No database. No account. No sync service. No subscription. Just files in your project that your AI agent can read with zero configuration.

## The Capture Form

`Cmd+Shift+X` opens a Spotlight-style window:

1. **Project** — dropdown, pre-selected to last used. Browse button to add new ones.
2. **Screenshot** — preview from clipboard. Forgot to screenshot first? Click the preview area to retry after you take one.
3. **Description** — what's wrong, in your words, right now while you're looking at it. Not later when you've forgotten.
4. **Tags** — optional, comma-separated.

`Cmd+Enter` to save. `Esc` to dismiss. Keyboard-only flow, zero mouse required.

## Web Dashboard & API

Snag runs a local server at `http://127.0.0.1:9999`. Open it in your browser to see all your projects and issues, or use the API from any tool:

```bash
# List all projects
curl http://127.0.0.1:9999/api/projects

# Get open issues for a project
curl http://127.0.0.1:9999/api/issues?project=/path/to/project&status=open

# Get the next issue to work on
curl http://127.0.0.1:9999/api/issues/next

# Mark an issue as resolved
curl -X PATCH http://127.0.0.1:9999/api/issues/ISSUE_ID \
  -H 'Content-Type: application/json' \
  -d '{"project": "/path/to/project", "status": "resolved"}'
```

This is the sweet spot between MCP (overkill) and raw file access (your tool has to know where to look and how to parse). Any AI agent, CLI tool, or script can query the API. No SDK, no auth, no setup.

## Install

```bash
git clone <repo-url> && cd snag
./setup.sh
```

That's it. Builds the app, copies it to `/Applications`, and launches it. You'll see a small icon in your menubar. No dock icon, no window — it stays out of your way until you need it.

For development:

```bash
npm install && npm start
```

## Features

- **Menubar app** — always available, never in the way, no dock icon
- **One hotkey** — `Cmd+Shift+X` (configurable)
- **Clipboard-based** — uses your OS's native screenshot tool, no custom capture logic
- **Project-aware** — captures go to the right project directory, most recent first
- **Gitignored automatically** — `.snag/` is added to your `.gitignore` on first capture
- **Auto-cleanup** — resolved issues are swept after a configurable retention period
- **Local API** — `http://127.0.0.1:9999/api` for CLI tools and AI agents
- **Web dashboard** — browse projects and issues at `http://127.0.0.1:9999`
- **Plain files** — Markdown + PNG, readable by anything, zero vendor lock-in

## Configuration

Config lives at `~/.config/snag/config.json`:

```json
{
  "hotkey": "CommandOrControl+Shift+X",
  "projects": [
    "/Users/you/projects/my-app",
    "/Users/you/projects/api"
  ],
  "lastProject": "/Users/you/projects/my-app",
  "cleanup": {
    "enabled": true,
    "intervalMinutes": 30,
    "retentionDays": 30,
    "autoDeleteResolved": true
  }
}
```

## The Real Workflow

Here's how it actually works when you're developing with AI agents:

Your agent is working on a feature. It takes a few minutes. Instead of staring at a terminal waiting for it to finish, you open the browser and test what's already deployed. You find three bugs. Old you would either (a) wait for the agent to finish, then describe each bug one at a time while slowly forgetting the details, or (b) open a notes app and type something vague like "sidebar broken on mobile" that future-you will hate.

With Snag, you screenshot each bug as you find it, hit `Cmd+Shift+X`, type a quick description while you're *looking at the problem*, and move on. By the time your agent finishes the current task, there's a neat queue of issues waiting in `.snag/` with full visual context. Point the agent at them. It reads the markdown, sees the screenshots, and knows exactly what to fix. You didn't wait. You didn't context-switch. You didn't lose any details.

The API makes this even smoother — your agent can call `http://127.0.0.1:9999/api/issues/next` to grab the next bug in the queue and `PATCH` it to `resolved` when it's done. You're testing, it's fixing. Parallel workflows, no coordination overhead.

This is why Jira doesn't fit here. You're not managing a backlog across a team. You're feeding context to an AI agent as fast as you can find bugs. The overhead of any "project management" tool is pure friction. You need a capture tool, not a planning tool.

## Who Is This For?

Solo developers and small teams who work with AI coding agents and find that the hardest part of fixing a visual bug is getting the context from the browser to the tool that's going to fix it. If you've ever pasted a screenshot into a chat, then typed "see the button in the top right? it's overlapping the sidebar" — Snag replaces that entire dance.

If you have a 20-person team with PMs, a QA department, and a Jira instance that someone is actually happy about — you probably don't need this. (But also, are they *really* happy about it?)

## License

MIT
