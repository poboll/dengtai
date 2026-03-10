import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AppLayout from "@/components/layout/AppLayout";
import { PlusIcon, SendIcon } from "@/components/icons/Icon";
import { fetchSSE } from "@/services/sseStream";
import { useAuth } from "@/context/AuthContext";
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

const STORAGE_KEY = 'dengtai-ai-sessions';
const ACTIVE_KEY = 'dengtai-ai-active-session';
const AiAssistantPage = () => {
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* corrupted data — reset */ }
    return [newSession()];
  });
  const [activeId, setActiveId] = useState<string>(() => {
    const saved = localStorage.getItem(ACTIVE_KEY);
    if (saved && sessions.some(s => s.id === saved)) return saved;
    return sessions[0]?.id ?? '';
  });
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingRef = useRef("");
  const rafRef = useRef(0);
  const streamDoneRef = useRef(false);
  const activeMsgIdRef = useRef<string | null>(null);
  const { tokens } = useAuth();

  const activeSession = sessions.find((s) => s.id === activeId) ?? sessions[0];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession.messages, scrollToBottom]);

  // localStorage 持久化
  useEffect(() => {
    const toSave = sessions.map(s => ({
      ...s,
      messages: s.messages.filter(m => m.id !== 'welcome').length === 0
        ? s.messages
        : s.messages.map(m => ({ ...m, streaming: undefined })),
    }));
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); } catch { /* quota exceeded */ }
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  const updateSession = useCallback((id: string, updater: (s: Session) => Session) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
  }, []);

  const handleNewSession = useCallback(() => {
    const s = newSession();
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    setInput("");
  }, []);
  const handleDeleteSession = useCallback((e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (filtered.length === 0) {
        const s = newSession();
        setActiveId(s.id);
        return [s];
      }
      if (sessionId === activeId) setActiveId(filtered[0].id);
      return filtered;
    });
  }, [activeId]);

  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || streaming) return;
    setInput("");
    setStreaming(true);
    pendingRef.current = "";
    streamDoneRef.current = false;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: q };
    const aId = crypto.randomUUID();
    activeMsgIdRef.current = aId;
    const assistantMsg: Message = { id: aId, role: "assistant", content: "", streaming: true };
    updateSession(activeId, (s) => ({
      ...s,
      title: s.messages.length === 1 ? q.slice(0, 30) : s.title,
      messages: [...s.messages, userMsg, assistantMsg],
    }));
    const tick = () => {
      const p = pendingRef.current;
      const mid = activeMsgIdRef.current;
      if (p.length > 0 && mid) {
        const take = p.length > 200 ? 10 : p.length > 50 ? 3 : 1;
        const chunk = p.slice(0, take);
        pendingRef.current = p.slice(take);
        updateSession(activeId, (s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === mid ? { ...m, content: m.content + chunk } : m
          ),
        }));
        rafRef.current = requestAnimationFrame(tick);
      } else if (streamDoneRef.current && p.length === 0) {
        if (mid) {
          updateSession(activeId, (s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === mid ? { ...m, streaming: false } : m
            ),
          }));
        }
        setStreaming(false);
        activeMsgIdRef.current = null;
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    const controller = new AbortController();
    abortRef.current = controller;
    const path = `/api/v1/ai/chat/stream?question=${encodeURIComponent(q)}&topK=5`;
    fetchSSE(path, {
      onChunk: (text) => { pendingRef.current += text; },
      onDone: () => { streamDoneRef.current = true; },
      onError: (err) => {
        streamDoneRef.current = true;
        if (err.name !== "AbortError") {
          pendingRef.current = "";
          updateSession(activeId, (s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === aId ? { ...m, content: "⚠️ 请求失败，请稍后重试。", streaming: false } : m
            ),
          }));
          setStreaming(false);
        }
      },
      signal: controller.signal,
      accessToken: null,
    });
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
              <li key={s.id} className={styles.sessionRow}>
                <button
                  type="button"
                  className={`${styles.sessionItem} ${s.id === activeId ? styles.sessionActive : ""}`}
                  onClick={() => setActiveId(s.id)}
                  title={s.title}
                >
                  <span className={styles.sessionTitle}>{s.title}</span>
                </button>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={(e) => handleDeleteSession(e, s.id)}
                  aria-label="删除会话"
                  title="删除会话"
                >
                  ×
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
