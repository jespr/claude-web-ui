// Client -> Server messages
export type ClientMessage =
  | { type: "prompt"; text: string }
  | { type: "interrupt" };

// Server -> Client messages
export type ServerMessage =
  | { type: "system_init"; session_id: string; tools: string[] }
  | { type: "text_delta"; text: string }
  | { type: "tool_start"; tool: string; id: string }
  | { type: "tool_done"; id: string }
  | { type: "assistant_message"; content: unknown[] }
  | { type: "result"; text: string; cost: number }
  | { type: "error"; message: string };
