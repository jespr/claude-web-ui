import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "../types.ts";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div style={{ ...styles.row, justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div style={isUser ? styles.userBubble : styles.assistantBubble}>
        {isUser ? (
          <p style={styles.text}>{message.content}</p>
        ) : (
          <div style={styles.markdown}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        {message.cost != null && message.cost > 0 && (
          <div style={styles.cost}>${message.cost.toFixed(4)}</div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: "flex",
    padding: "4px 16px",
  },
  userBubble: {
    maxWidth: "70%",
    padding: "10px 14px",
    borderRadius: 16,
    background: "#007aff",
    color: "#fff",
    fontSize: 15,
    lineHeight: 1.5,
  },
  assistantBubble: {
    maxWidth: "85%",
    padding: "10px 14px",
    borderRadius: 16,
    background: "#f1f1f1",
    color: "#1a1a1a",
    fontSize: 15,
    lineHeight: 1.5,
  },
  text: {
    margin: 0,
    whiteSpace: "pre-wrap",
  },
  markdown: {
    overflow: "auto",
  },
  cost: {
    marginTop: 6,
    fontSize: 11,
    color: "#888",
    textAlign: "right" as const,
  },
};
