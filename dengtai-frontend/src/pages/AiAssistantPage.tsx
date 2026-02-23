import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AppLayout from "@/components/layout/AppLayout";
import { PlusIcon, SendIcon } from "@/components/icons/Icon";
import styles from "./AiAssistantPage.module.css";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  streaming?: boolean;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: `你好！我是**灯塔 AI 助手** ✨

我可以帮你：
- 解答技术问题，结合站内知识库给出精准回答
- 推荐相关优质文章
- 解释复杂概念，生成示例代码

有什么想了解的，直接问我吧！`,
};

function newSession(): Session {
  return {
    id: crypto.randomUUID(),
    title: "新会话",
    messages: [WELCOME_MESSAGE],
    createdAt: Date.now(),
  };
}

const AiAssistantPage = () => {
  const [sessions, setSessions] = useState<Session[]>(() => [newSession()]);
  const [activeId, setActiveId] = useState<string>(() => sessions[0].id);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find((s) => s.id === activeId) ?? sessions[0];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession.messages, scrollToBottom]);

  const updateSession = useCallback((id: string, updater: (s: Session) => Session) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
  }, []);

  const handleNewSession = useCallback(() => {
    const s = newSession();
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    setInput("");
  }, []);

  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || streaming) return;

    setInput("");
    setStreaming(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: q,
    };
    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      streaming: true,
    };

    // 用第一条用户消息作为会话标题
    updateSession(activeId, (s) => ({
      ...s,
      title: s.messages.length === 1 ? q.slice(0, 30) : s.title,
      messages: [...s.messages, userMsg, assistantMsg],
    }));

    abortRef.current = new AbortController();
    try {
      const url = `/api/v1/ai/chat/stream?question=${encodeURIComponent(q)}&topK=5`;
      const resp = await fetch(url, { signal: abortRef.current.signal });
      if (!resp.ok || !resp.body) throw new Error("请求失败");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE 格式: "data: <text>\n\n"
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.startsWith("data: ") ? part.slice(6) : part;
          if (line === "[DONE]") break;
          updateSession(activeId, (s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: m.content + line }
                : m
            ),
          }));
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        updateSession(activeId, (s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: "⚠️ 请求失败，请稍后重试。" }
              : m
          ),
        }));
      }
    } finally {
      updateSession(activeId, (s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === assistantMsgId ? { ...m, streaming: false } : m
        ),
      }));
      setStreaming(false);
    }
  }, [input, streaming, activeId, updateSession]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // 自动调整 textarea 高度
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  }, []);

  return (
    <AppLayout variant="full">
      <div className={styles.layout}>
        {/* 左侧会话列表 */}
        <aside className={styles.sidebar}>
          <button type="button" className={styles.newBtn} onClick={handleNewSession}>
            <PlusIcon width={16} height={16} />
            新会话
          </button>
          <ul className={styles.sessionList}>
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`${styles.sessionItem} ${s.id === activeId ? styles.sessionActive : ""}`}
                  onClick={() => setActiveId(s.id)}
                  title={s.title}
                >
                  <span className={styles.sessionTitle}>{s.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* 右侧聊天区 */}
        <main className={styles.chat}>
          <div className={styles.messages}>
            {activeSession.messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.bubble} ${msg.role === "user" ? styles.bubbleUser : styles.bubbleAssistant}`}
              >
                {msg.role === "assistant" ? (
                  <div className={styles.markdownBody}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content || (msg.streaming ? "▍" : "")}
                    </ReactMarkdown>
                    {msg.streaming && msg.content && (
                      <span className={styles.cursor}>▍</span>
                    )}
                  </div>
                ) : (
                  <p className={styles.userText}>{msg.content}</p>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入框 */}
          <div className={styles.inputArea}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题… （Enter 发送，Shift+Enter 换行）"
              rows={1}
              disabled={streaming}
            />
            <button
              type="button"
              className={`${styles.sendBtn} ${streaming ? styles.sendBtnDisabled : ""}`}
              onClick={handleSend}
              disabled={streaming || !input.trim()}
              aria-label="发送"
            >
              <SendIcon width={18} height={18} />
            </button>
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default AiAssistantPage;
