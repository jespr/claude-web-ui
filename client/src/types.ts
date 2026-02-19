// Server -> Client messages
export type ServerMessage =
  | { type: "system_init"; session_id: string; tools: string[] }
  | { type: "text_delta"; text: string }
  | { type: "tool_start"; tool: string; id: string }
  | { type: "tool_done"; id: string }
  | { type: "assistant_message"; content: ContentBlock[] }
  | { type: "result"; text: string; cost: number }
  | { type: "error"; message: string };

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  cost?: number;
}

export interface ToolCall {
  id: string;
  tool: string;
  status: "running" | "done";
}
