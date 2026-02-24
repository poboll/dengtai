import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import Tag from "@/components/common/Tag";
import SectionHeader from "@/components/common/SectionHeader";
import { ArrowRightIcon } from "@/components/icons/Icon";
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./CourseDetailPage.module.css";
import { knowpostService } from "@/services/knowpostService";
import { useAuth } from "@/context/AuthContext";
import type { KnowpostDetailResponse } from "@/types/knowpost";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LikeFavBar from "@/components/common/LikeFavBar";
import FollowButton from "@/components/common/FollowButton";
import { fetchSSE } from "@/services/sseStream";

const parseAvatarUserId = (url?: string): number | undefined => {
  if (!url) return undefined;
  const m = url.match(/\/avatars\/(\d+)-/);
  return m ? Number(m[1]) : undefined;
};

const RAG_TOP_K = 5;
const RAG_MAX_TOKENS = 1024;

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { tokens, user } = useAuth();
  const [detail, setDetail] = useState<KnowpostDetailResponse | null>(null);
  const [contentText, setContentText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const previewBoxRef = useRef<HTMLDivElement | null>(null);
  const [showNavLeft, setShowNavLeft] = useState(false);
  const [showNavRight, setShowNavRight] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  // RAG 问答状态
  const [ragQuestion, setRagQuestion] = useState("");
  const [ragAnswer, setRagAnswer] = useState("");
  const [ragLoading, setRagLoading] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingCharsRef = useRef("");
  const displayedRef = useRef("");
  const rafRef = useRef(0);
  const streamDoneRef = useRef(false);

  // 加载详情 + 正文
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!id) return;
      setError(null);
      try {
        const resp = await knowpostService.detail(id, tokens?.accessToken ?? undefined);
        if (cancelled) return;
        setDetail(resp);
        if (resp.contentUrl) {
          const allowAnonymous = resp.visible === "public";
          if (allowAnonymous || !!tokens?.accessToken) {
            try {
              const text = await fetch(resp.contentUrl, { credentials: "omit" }).then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.text();
              });
              if (!cancelled) {
                setContentText(text);
                setContentError(null);
              }
            } catch {
              if (!cancelled) setContentError("正文暂不可读，可能为非公开或跨域受限");
            }
          } else {
            setContentError("该知文非公开，请登录后查看正文");
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "加载失败";
        if (!cancelled) setError(msg);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [id, tokens?.accessToken]);

  // 图片行宽度计算
  useEffect(() => {
    const calc = () => {
      const el = rowRef.current;
      if (!el) return;
      const w = el.clientWidth;
      setVisibleCount(Math.max(1, Math.floor((w + 12) / 192)));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [detail?.images]);

  useEffect(() => {
    const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouch(touch);
    if (touch) { setShowNavLeft(true); setShowNavRight(true); }
  }, []);

  const handlePreviewMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouch) return;
    const el = previewBoxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const threshold = Math.max(60, Math.min(120, rect.width * 0.08));
    setShowNavLeft(x < threshold);
    setShowNavRight(x > rect.width - threshold);
  };

  const handlePreviewMouseLeave = () => {
    if (isTouch) return;
    setShowNavLeft(false);
    setShowNavRight(false);
  };

  const openPreview = (index: number) => { setPreviewIndex(index); setPreviewOpen(true); };
  const prevImage = () => { if (!detail?.images?.length) return; setPreviewIndex(i => (i - 1 + detail.images.length) % detail.images.length); };
  const nextImage = () => { if (!detail?.images?.length) return; setPreviewIndex(i => (i + 1) % detail.images.length); };

  // RAG: 停止流式
  const stopRag = () => {
    if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
    if (pendingCharsRef.current) {
      displayedRef.current += pendingCharsRef.current;
      pendingCharsRef.current = "";
      setRagAnswer(displayedRef.current);
    }
    setRagLoading(false);
  };

  // RAG: 启动流式问答（fetchSSE + 自适应打字机）
  const startRag = () => {
    if (!id) return;
    const q = ragQuestion.trim();
    if (!q) return;
    if (detail && detail.visible !== "public") { setRagError("仅公开知文支持问答"); return; }

    stopRag();
    setRagError(null);
    setRagAnswer("");
    pendingCharsRef.current = "";
    displayedRef.current = "";
    streamDoneRef.current = false;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setRagLoading(true);

    const tick = () => {
      const pending = pendingCharsRef.current;
      if (pending.length > 0) {
        const take = pending.length > 200 ? 10 : pending.length > 50 ? 3 : 1;
        const n = Math.min(take, pending.length);
        displayedRef.current += pending.slice(0, n);
        pendingCharsRef.current = pending.slice(n);
        setRagAnswer(displayedRef.current);
        rafRef.current = requestAnimationFrame(tick);
      } else if (streamDoneRef.current) {
        rafRef.current = 0;
        setRagLoading(false);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    const path = `/api/v1/knowposts/${id}/qa/stream?question=${encodeURIComponent(q)}&topK=${RAG_TOP_K}&maxTokens=${RAG_MAX_TOKENS}`;
    fetchSSE(path, {
      onChunk: (text) => { pendingCharsRef.current += text; },
      onDone: () => { streamDoneRef.current = true; abortControllerRef.current = null; },
      onError: (err) => { streamDoneRef.current = true; abortControllerRef.current = null; setRagError(err.message); },
      signal: controller.signal,
      accessToken: tokens?.accessToken,
    });
  };

  // 页面卸载清理
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // 作者信息
  const authorId = detail?.authorId ? Number(detail.authorId) : parseAvatarUserId(detail?.authorAvatar);
  const isSelf = (authorId != null && user?.id === authorId) || (!!detail?.authorNickname && !!user?.nickname && detail.authorNickname === user.nickname);

  return (
    <AppLayout
      header={<MainHeader headline={detail?.title ?? ""} subtitle="" rightSlot={<AuthStatus />} />}
      variant="cardless"
    >
      <article className={styles.detailCard}>
        {error ? <div style={{ color: "var(--color-danger)" }}>{error}</div> : null}
        {detail?.images?.length ? (
          <div ref={rowRef} className={styles.imageRow}>
            {detail.images.slice(0, visibleCount).map((src, idx) => {
              const isLast = idx === visibleCount - 1 && detail.images.length > visibleCount;
              return (
                <div key={src + idx} className={styles.imageItem} onClick={() => openPreview(idx)}>
                  <img className={styles.image} src={src} alt={detail.title} />
                  {isLast ? <div className={styles.moreBadge}>+{detail.images.length - visibleCount}</div> : null}
                </div>
              );
            })}
          </div>
        ) : null}

        <div className={styles.titleBlock}>
          <div className={styles.meta}>
            {detail?.authorAvatar ? <img className={styles.authorAvatar} src={detail.authorAvatar} alt={detail.authorNickname} /> : null}
            <span className={styles.authorName}>{detail?.authorNickname ?? ""}</span>
            {authorId && !isSelf ? <FollowButton targetUserId={authorId} /> : null}
          </div>
          <div className={styles.tagList}>
            {(detail?.tags ?? []).map(tag => <Tag key={tag}>#{tag}</Tag>)}
          </div>
          <div className={styles.meta}>
            {detail?.publishTime ? <span>{new Date(detail.publishTime).toLocaleDateString("zh-CN")}</span> : null}
          </div>
          <div className={styles.bottomBar}>
            {detail ? (
              <LikeFavBar
                entityId={detail.id}
                initialCounts={{ like: detail.likeCount ?? 0, fav: detail.favoriteCount ?? 0 }}
                initialState={{ liked: detail.liked, faved: detail.faved }}
              />
            ) : null}
          </div>
        </div>

        <SectionHeader title="内容正文" subtitle="" />

        <div className={styles.contentRow}>
          <div className={styles.contentMain}>
            <div className={`${styles.body} ${styles.markdown}`}>
              {contentText ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                  a: ({ node: _n, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
                  img: ({ node: _n, ...props }) => <img {...props} style={{ maxWidth: "100%", borderRadius: 12 }} />,
                }}>{contentText}</ReactMarkdown>
              ) : "暂无内容"}
            </div>
            {contentError ? (
              <div style={{ color: "var(--color-danger)" }}>
                {contentError} {detail?.contentUrl ? <a href={detail.contentUrl} target="_blank" rel="noreferrer">查看原文</a> : null}
              </div>
            ) : null}
          </div>

          <aside className={styles.ragPanel}>
            <div className={styles.ragBody}>
              <textarea
                className={styles.ragTextarea}
                placeholder="围绕本知文提问，例如：这篇知文的核心观点是什么？"
                value={ragQuestion}
                onChange={(e) => setRagQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) startRag(); }}
              />
              <div className={styles.ragControls}>
                <button type="button" className={`${styles.ragBtn} ${styles.ragBtnPrimary}`} onClick={startRag} disabled={ragLoading || !ragQuestion.trim()}>
                  {ragLoading ? "生成中…" : "发送"}
                </button>
                <button type="button" className={`${styles.ragBtn} ${styles.ragBtnGhost}`} onClick={stopRag} disabled={!ragLoading}>停止</button>
              </div>
              <div className={styles.ragHint}>说明：仅"公开"知文支持问答，答案基于当前知文的索引片段实时生成。</div>
              {ragError ? <div style={{ color: "var(--color-danger)" }}>{ragError}</div> : null}
              <div className={styles.ragAnswer}>
                {ragAnswer ? (
                  <div className={`${styles.markdown} ${ragLoading ? styles.markdownStreaming : ""}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                      a: ({ node: _n, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
                      img: ({ node: _n, ...props }) => <img {...props} style={{ maxWidth: "100%", borderRadius: 12 }} />,
                    }}>{ragAnswer}</ReactMarkdown>
                  </div>
                ) : (
                  <div className={styles.ragPlaceholder}>
                    {ragLoading ? "等待生成…" : "这里将展示答案（支持流式）"}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>

        {previewOpen && detail?.images?.length ? (
          <div className={styles.previewOverlay} onClick={() => setPreviewOpen(false)}>
            <div className={styles.previewBox} ref={previewBoxRef} onMouseMove={handlePreviewMouseMove} onMouseLeave={handlePreviewMouseLeave} onClick={(e) => e.stopPropagation()}>
              <img className={styles.previewImage} src={detail.images[previewIndex]} alt={detail.title} />
              <button type="button" className={`${styles.navButton} ${styles.navButtonLeft} ${showNavLeft ? styles.navButtonVisible : ""}`} onClick={(e) => { e.stopPropagation(); prevImage(); }} aria-label="上一张">
                <ArrowRightIcon width={24} height={24} style={{ transform: "rotate(180deg)" }} />
              </button>
              <button type="button" className={`${styles.navButton} ${styles.navButtonRight} ${showNavRight ? styles.navButtonVisible : ""}`} onClick={(e) => { e.stopPropagation(); nextImage(); }} aria-label="下一张">
                <ArrowRightIcon width={24} height={24} />
              </button>
              <button type="button" className={styles.closeButton} onClick={(e) => { e.stopPropagation(); setPreviewOpen(false); }} aria-label="关闭">✕</button>
            </div>
          </div>
        ) : null}
      </article>
    </AppLayout>
  );
};

export default CourseDetailPage;
