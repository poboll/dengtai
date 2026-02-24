import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import Tag from "@/components/common/Tag";
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

const mdComponents = {
  a: ({ node: _n, ...props }: any) => <a {...props} target="_blank" rel="noreferrer" />,
  img: ({ node: _n, ...props }: any) => <img {...props} style={{ maxWidth: "100%", borderRadius: 12 }} />,
};

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { tokens, user } = useAuth();
  const [detail, setDetail] = useState<KnowpostDetailResponse | null>(null);
  const [contentText, setContentText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);

  // Image preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const previewBoxRef = useRef<HTMLDivElement | null>(null);
  const [showNavLeft, setShowNavLeft] = useState(false);
  const [showNavRight, setShowNavRight] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  // RAG Q&A
  const [ragQuestion, setRagQuestion] = useState("");
  const [ragAnswer, setRagAnswer] = useState("");
  const [ragLoading, setRagLoading] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingCharsRef = useRef("");
  const displayedRef = useRef("");
  const rafRef = useRef(0);
  const streamDoneRef = useRef(false);

  // ── Fetch detail + content ──
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
              if (!cancelled) { setContentText(text); setContentError(null); }
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

  // ── Touch detection ──
  useEffect(() => {
    const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouch(touch);
    if (touch) { setShowNavLeft(true); setShowNavRight(true); }
  }, []);

  // ── Preview nav hover zones ──
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

  // ── RAG: stop stream ──
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

  // ── RAG: start stream with typewriter ──
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
      accessToken: null,
    });
  };

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── Derived data ──
  const authorId = detail?.authorId ? Number(detail.authorId) : parseAvatarUserId(detail?.authorAvatar);
  const isSelf = (authorId != null && user?.id === authorId) || (!!detail?.authorNickname && !!user?.nickname && detail.authorNickname === user.nickname);
  const images = detail?.images ?? [];
  const hasImages = images.length > 0;
  const publishDate = detail?.publishTime ? new Date(detail.publishTime).toLocaleDateString("zh-CN") : null;

  return (
    <AppLayout
      header={<MainHeader headline={detail?.title ?? ""} subtitle="" rightSlot={<AuthStatus />} />}
      variant="cardless"
    >
      <article className={styles.article}>
        {error && <div className={styles.errorText}>{error}</div>}

        {/* ── Hero Cover ── */}
        {hasImages && (
          <div className={styles.hero} onClick={() => openPreview(0)}>
            <img src={images[0]} className={styles.heroImage} alt={detail?.title} />
            <div className={styles.heroOverlay}>
              <h1 className={styles.heroTitle}>{detail?.title}</h1>
              {detail?.description && <p className={styles.heroDesc}>{detail.description}</p>}
            </div>
          </div>
        )}

        {/* ── Thumbnail Strip (multi-image) ── */}
        {images.length > 1 && (
          <div className={styles.thumbStrip}>
            {images.map((src, idx) => (
              <div
                key={src + idx}
                className={`${styles.thumb} ${previewIndex === idx ? styles.thumbActive : ""}`}
                onClick={() => openPreview(idx)}
              >
                <img src={src} alt={`${detail?.title} ${idx + 1}`} />
                {idx === images.length - 1 && images.length > 6 && (
                  <div className={styles.moreBadge}>+{images.length - 6}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Title Card (fallback: no images) ── */}
        {!hasImages && detail && (
          <div className={styles.titleCard}>
            <h1 className={styles.titleCardHeading}>{detail.title}</h1>
            {detail.description && <p className={styles.titleCardDesc}>{detail.description}</p>}
          </div>
        )}

        {/* ── Author Bar ── */}
        {detail && (
          <div className={styles.authorBar}>
            <div className={styles.authorInfo}>
              {detail.authorAvatar && (
                <img className={styles.avatar} src={detail.authorAvatar} alt={detail.authorNickname} />
              )}
              <div className={styles.authorMeta}>
                <span className={styles.authorName}>{detail.authorNickname}</span>
                {publishDate && <span className={styles.publishDate}>{publishDate}</span>}
              </div>
              {authorId && !isSelf && <FollowButton targetUserId={authorId} />}
            </div>
            <div className={styles.actions}>
              <LikeFavBar
                entityId={detail.id}
                initialCounts={{ like: detail.likeCount ?? 0, fav: detail.favoriteCount ?? 0 }}
                initialState={{ liked: detail.liked, faved: detail.faved }}
              />
            </div>
          </div>
        )}

        {/* ── Tags ── */}
        {detail?.tags?.length ? (
          <div className={styles.tagRow}>
            {detail.tags.map(tag => <Tag key={tag}>#{tag}</Tag>)}
          </div>
        ) : null}

        {/* ── Description Callout (shown separately when hero already displays title) ── */}
        {detail?.description && hasImages && (
          <div className={styles.descCallout}>{detail.description}</div>
        )}

        {/* ── Content Row: Markdown + RAG Panel ── */}
        <div className={styles.contentRow}>
          <div className={styles.contentMain}>
            <div className={`${styles.body} ${styles.markdown}`}>
              {contentText ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {contentText}
                </ReactMarkdown>
              ) : "暂无内容"}
            </div>
            {contentError && (
              <div className={styles.contentError}>
                {contentError}
                {detail?.contentUrl && (
                  <a href={detail.contentUrl} target="_blank" rel="noreferrer">查看原文</a>
                )}
              </div>
            )}
          </div>

          <aside className={styles.ragPanel}>
            <div className={styles.ragHeader}>
              <span className={styles.ragIcon}>✨</span>
              <span className={styles.ragTitle}>AI 智能问答</span>
            </div>
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
              {ragError && <div className={styles.errorText}>{ragError}</div>}
              <div className={styles.ragAnswer}>
                {ragAnswer ? (
                  <div className={`${styles.markdown} ${ragLoading ? styles.markdownStreaming : ""}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                      {ragAnswer}
                    </ReactMarkdown>
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

        {/* ── Image Preview Overlay ── */}
        {previewOpen && images.length > 0 && (
          <div className={styles.previewOverlay} onClick={() => setPreviewOpen(false)}>
            <div
              className={styles.previewBox}
              ref={previewBoxRef}
              onMouseMove={handlePreviewMouseMove}
              onMouseLeave={handlePreviewMouseLeave}
              onClick={(e) => e.stopPropagation()}
            >
              <img className={styles.previewImage} src={images[previewIndex]} alt={detail?.title} />
              <button
                type="button"
                className={`${styles.navButton} ${styles.navButtonLeft} ${showNavLeft ? styles.navButtonVisible : ""}`}
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                aria-label="上一张"
              >
                <ArrowRightIcon width={24} height={24} style={{ transform: "rotate(180deg)" }} />
              </button>
              <button
                type="button"
                className={`${styles.navButton} ${styles.navButtonRight} ${showNavRight ? styles.navButtonVisible : ""}`}
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                aria-label="下一张"
              >
                <ArrowRightIcon width={24} height={24} />
              </button>
              <button
                type="button"
                className={styles.closeButton}
                onClick={(e) => { e.stopPropagation(); setPreviewOpen(false); }}
                aria-label="关闭"
              >✕</button>
            </div>
          </div>
        )}
      </article>
    </AppLayout>
  );
};

export default CourseDetailPage;
