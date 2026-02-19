import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, ServerMessage, ToolCall } from "../types.ts";

const WS_URL = "ws://localhost:3001";

export function useClaudeSession() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTools, setActiveTools] = useState<ToolCall[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const streamingTextRef = useRef("");
  const streamingIdRef = useRef<string | null>(null);
  const msgIdCounter = useRef(0);

  const nextId = () => String(++msgIdCounter.current);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => {
      setIsConnected(false);
      setIsStreaming(false);
    };

    ws.onmessage = (event) => {
      const msg: ServerMessage = JSON.parse(event.data);
      handleMessage(msg);
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case "system_init":
        setSessionId(msg.session_id);
        break;

      case "text_delta":
        // Accumulate streaming text into current assistant message
        if (!streamingIdRef.current) {
          const id = nextId();
          streamingIdRef.current = id;
          streamingTextRef.current = msg.text;
          setIsStreaming(true);
          setMessages((prev) => [
            ...prev,
            { id, role: "assistant", content: msg.text },
          ]);
        } else {
          streamingTextRef.current += msg.text;
          const currentId = streamingIdRef.current;
          const currentText = streamingTextRef.current;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === currentId ? { ...m, content: currentText } : m,
            ),
          );
        }
        break;

      case "tool_start":
        setActiveTools((prev) => [
          ...prev,
          { id: msg.id, tool: msg.tool, status: "running" },
        ]);
        break;

      case "tool_done":
        setActiveTools((prev) =>
          prev.map((t) =>
            t.status === "running" ? { ...t, status: "done" } : t,
          ),
        );
        break;

      case "assistant_message":
        // Full assistant message received; finalize any streaming
        finalizeStreaming();
        break;

      case "result":
        finalizeStreaming();
        // Update last assistant message with cost
        if (msg.cost > 0) {
          setMessages((prev) => {
            const last = [...prev];
            for (let i = last.length - 1; i >= 0; i--) {
              if (last[i].role === "assistant") {
                last[i] = { ...last[i], cost: msg.cost };
                break;
              }
            }
            return last;
          });
        }
        break;

      case "error":
        finalizeStreaming();
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            content: `Error: ${msg.message}`,
          },
        ]);
        break;
    }
  }, []);

  const finalizeStreaming = useCallback(() => {
    streamingIdRef.current = null;
    streamingTextRef.current = "";
    setIsStreaming(false);
    setActiveTools([]);
  }, []);

  const sendPrompt = useCallback(
    (text: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "user", content: text },
      ]);

      wsRef.current.send(JSON.stringify({ type: "prompt", text }));
    },
    [],
  );

  const interrupt = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "interrupt" }));
  }, []);

  return {
    messages,
    isStreaming,
    isConnected,
    activeTools,
    sessionId,
    sendPrompt,
    interrupt,
  };
}
