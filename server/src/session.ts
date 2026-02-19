import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKUserMessage, SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import type { ServerMessage } from "./protocol.js";

type MessageSender = (msg: ServerMessage) => void;

// The fields the SDK actually reads from the async iterable input.
// session_id and parent_tool_use_id are required by the type but the SDK
// fills them in at runtime — we supply empty defaults.
function makeUserMessage(text: string): SDKUserMessage {
  return {
    type: "user",
    session_id: "",
    parent_tool_use_id: null,
    message: { role: "user", content: text },
  };
}

export class ClaudeSession {
  private messageQueue: SDKUserMessage[] = [];
  private resolveWaiting: ((msg: SDKUserMessage) => void) | null = null;
  private closed = false;
  private queryInstance: ReturnType<typeof query> | null = null;

  constructor(
    private send: MessageSender,
    private cwd: string,
  ) {}

  async start(): Promise<void> {
    const generator = this.createMessageGenerator();

    this.queryInstance = query({
      prompt: generator,
      options: {
        cwd: this.cwd,
        systemPrompt: { type: "preset", preset: "claude_code" },
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        includePartialMessages: true,
      },
    });

    try {
      for await (const message of this.queryInstance) {
        this.handleSDKMessage(message);
      }
    } catch (err) {
      if (!this.closed) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.send({ type: "error", message: errMsg });
      }
    }
  }

  pushPrompt(text: string): void {
    const msg = makeUserMessage(text);

    if (this.resolveWaiting) {
      const resolve = this.resolveWaiting;
      this.resolveWaiting = null;
      resolve(msg);
    } else {
      this.messageQueue.push(msg);
    }
  }

  async interrupt(): Promise<void> {
    if (this.queryInstance) {
      await this.queryInstance.interrupt();
    }
  }

  close(): void {
    this.closed = true;
    if (this.resolveWaiting) {
      this.resolveWaiting = null;
    }
  }

  private async *createMessageGenerator(): AsyncGenerator<SDKUserMessage> {
    while (!this.closed) {
      if (this.messageQueue.length > 0) {
        yield this.messageQueue.shift()!;
      } else {
        const msg = await new Promise<SDKUserMessage>((resolve) => {
          this.resolveWaiting = resolve;
        });
        if (this.closed) return;
        yield msg;
      }
    }
  }

  private handleSDKMessage(message: SDKMessage): void {
    if (this.closed) return;

    switch (message.type) {
      case "system": {
        if (message.subtype === "init") {
          this.send({
            type: "system_init",
            session_id: message.session_id,
            tools: message.tools ?? [],
          });
        }
        break;
      }

      case "stream_event": {
        const event = message.event;
        if (!event) break;

        if (event.type === "content_block_delta") {
          const delta = event.delta;
          if ("text" in delta && delta.type === "text_delta") {
            this.send({ type: "text_delta", text: delta.text });
          }
        }

        if (event.type === "content_block_start") {
          const block = event.content_block;
          if (block.type === "tool_use") {
            this.send({
              type: "tool_start",
              tool: block.name,
              id: block.id,
            });
          }
        }

        if (event.type === "content_block_stop") {
          this.send({ type: "tool_done", id: String(event.index) });
        }
        break;
      }

      case "assistant": {
        const content = message.message?.content;
        if (content) {
          this.send({
            type: "assistant_message",
            content: content as unknown[],
          });
        }
        break;
      }

      case "result": {
        this.send({
          type: "result",
          text: "result" in message ? (message as { result: string }).result ?? "" : "",
          cost: message.total_cost_usd ?? 0,
        });
        break;
      }
    }
  }
}
