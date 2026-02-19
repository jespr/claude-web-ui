import type { ToolCall } from "../types.ts";

interface ToolActivityProps {
  tools: ToolCall[];
}

export function ToolActivity({ tools }: ToolActivityProps) {
  const running = tools.filter((t) => t.status === "running");
  if (running.length === 0) return null;

  return (
    <div style={styles.container}>
      {running.map((t) => (
        <div key={t.id} style={styles.item}>
          <span style={styles.spinner} />
          <span style={styles.label}>{t.tool}</span>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    gap: 8,
    padding: "8px 16px",
    flexWrap: "wrap",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    background: "#f0f0f0",
    borderRadius: 12,
    fontSize: 13,
    color: "#555",
  },
  spinner: {
    display: "inline-block",
    width: 10,
    height: 10,
    border: "2px solid #ccc",
    borderTopColor: "#666",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  label: {
    fontFamily: "monospace",
  },
};
