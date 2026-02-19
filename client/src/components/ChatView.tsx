import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessage, ToolCall } from "../types.ts";
import { MessageBubble } from "./MessageBubble.tsx";
import { ToolActivity } from "./ToolActivity.tsx";

interface ChatViewProps {
  messages: ChatMessage[];
  activeTools: ToolCall[];
  isStreaming: boolean;
  isConnected: boolean;
  onSend: (text: string) => void;
  onInterrupt: () => void;
}

export function ChatView({
  messages,
  activeTools,
  isStreaming,
  isConnected,
  onSend,
  onInterrupt,
}: ChatViewProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTools]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.messageList}>
        {messages.length === 0 && (
          <div style={styles.empty}>Send a message to start a conversation.</div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <ToolActivity tools={activeTools} />
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} style={styles.inputBar}>
        <input
          style={styles.input}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          disabled={!isConnected}
        />
        {isStreaming ? (
          <button type="button" onClick={onInterrupt} style={styles.stopBtn}>
            Stop
          </button>
        ) : (
          <button
            type="submit"
            style={styles.sendBtn}
            disabled={!isConnected || !input.trim()}
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 0",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  empty: {
    textAlign: "center" as const,
    color: "#999",
    marginTop: 80,
    fontSize: 15,
  },
  inputBar: {
    display: "flex",
    gap: 8,
    padding: 16,
    borderTop: "1px solid #e0e0e0",
    background: "#fff",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 20,
    border: "1px solid #ddd",
    fontSize: 15,
    outline: "none",
  },
  sendBtn: {
    padding: "10px 20px",
    borderRadius: 20,
    border: "none",
    background: "#007aff",
    color: "#fff",
    fontSize: 15,
    cursor: "pointer",
  },
  stopBtn: {
    padding: "10px 20px",
    borderRadius: 20,
    border: "none",
    background: "#ff3b30",
    color: "#fff",
    fontSize: 15,
    cursor: "pointer",
  },
};
