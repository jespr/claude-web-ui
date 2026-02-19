# Claude Code Web UI

A web interface for Claude Code. React frontend talks to a Claude Code agent running on the server via WebSocket, giving you the full Claude Code experience (file editing, shell commands, code search, etc.) in the browser.

## Architecture

```
React (browser)  <── WebSocket ──>  Express + WS server  <── subprocess ──>  Claude Code
```

## Prerequisites

- Node.js >= 18
- An [Anthropic API key](https://console.anthropic.com/)
- Claude Code CLI installed (`npm install -g @anthropic-ai/claude-code`)

## Setup

```bash
git clone https://github.com/jespr/claude-web-ui.git
cd claude-web-ui
```

### Server

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` and set your values:

```
ANTHROPIC_API_KEY=sk-ant-...
CWD=/path/to/project-you-want-claude-to-work-on
```

### Client

```bash
cd client
npm install
```

## Running

Start both in separate terminals:

```bash
# Terminal 1 — server on :3001
cd server
npm run dev

# Terminal 2 — client on :5173
cd client
npm run dev
```

Open http://localhost:5173 and start chatting.

## Features

- Streaming token-by-token responses
- Tool activity indicators (see when Claude is reading files, running commands, etc.)
- Interrupt button to stop mid-generation
- Multi-turn conversations
- Markdown rendering for assistant responses
- Full Claude Code tool access (Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch)

## Configuration

| Environment variable | Description | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | (required) |
| `CWD` | Working directory Claude operates in | `process.cwd()` |
| `PORT` | WebSocket server port | `3001` |

## How it works

The server uses the [Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk) in **streaming input mode** — it spawns a Claude Code subprocess and bridges messages between the browser (WebSocket) and the agent (async generator). Permission mode is set to `bypassPermissions`, so Claude can use all tools without approval prompts.
