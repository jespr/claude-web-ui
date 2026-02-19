import { useClaudeSession } from "./hooks/useClaudeSession.ts";
import { ChatView } from "./components/ChatView.tsx";

export function App() {
  const {
    messages,
    isStreaming,
    isConnected,
    activeTools,
    sendPrompt,
    interrupt,
  } = useClaudeSession();

  return (
    <>
      <style>{globalStyles}</style>
      <ChatView
        messages={messages}
        activeTools={activeTools}
        isStreaming={isStreaming}
        isConnected={isConnected}
        onSend={sendPrompt}
        onInterrupt={interrupt}
      />
    </>
  );
}

const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #fff; }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
