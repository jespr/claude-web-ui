import { readFileSync } from "fs";
import { resolve, join } from "path";
import { homedir } from "os";

type McpServerConfig = {
  command: string;
  args?: string[];
  env?: Record<string, string>;
} | {
  type: "sse";
  url: string;
  headers?: Record<string, string>;
};

type McpServers = Record<string, McpServerConfig>;

/**
 * Load MCP server configs from (in order of precedence):
 * 1. server/mcp-servers.json (explicit config for this app)
 * 2. <cwd>/.claude/settings.json (project-level Claude Code settings)
 * 3. ~/.claude/settings.json (user-level Claude Code settings)
 *
 * Later sources fill in servers not already defined (no overwriting).
 */
export function loadMcpServers(cwd: string): McpServers {
  const merged: McpServers = {};

  const sources = [
    resolve("mcp-servers.json"),
    join(cwd, ".claude", "settings.json"),
    join(homedir(), ".claude", "settings.json"),
  ];

  for (const path of sources) {
    const servers = readMcpFromFile(path);
    for (const [name, config] of Object.entries(servers)) {
      if (!(name in merged)) {
        merged[name] = config;
      }
    }
  }

  return merged;
}

function readMcpFromFile(path: string): McpServers {
  try {
    const raw = readFileSync(path, "utf-8");
    const json = JSON.parse(raw);

    // mcp-servers.json: top-level is the server map
    // settings.json: servers live under mcpServers key
    if (json.mcpServers && typeof json.mcpServers === "object") {
      return json.mcpServers as McpServers;
    }

    // If every value looks like a server config, treat the whole object as servers
    if (typeof json === "object" && !Array.isArray(json)) {
      const values = Object.values(json);
      if (values.length > 0 && values.every(isServerConfig)) {
        return json as McpServers;
      }
    }
  } catch {
    // File doesn't exist or is invalid — skip
  }
  return {};
}

function isServerConfig(val: unknown): val is McpServerConfig {
  if (typeof val !== "object" || val === null) return false;
  const obj = val as Record<string, unknown>;
  return typeof obj.command === "string" || obj.type === "sse";
}
