import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import SectionHeader from "@/components/common/SectionHeader";
import SearchBar from "@/components/common/SearchBar";
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./SearchPage.module.css";
import { searchService } from "@/services/searchService";
import type { FeedItem } from "@/types/knowpost";
import CourseCard from "@/components/cards/CourseCard";
import LikeFavBar from "@/components/common/LikeFavBar";
import { useAuth } from "@/context/AuthContext";

const SKELETON_COUNT = 6;

const SearchPage = () => {
  const [q, setQ] = useState("");
  const [tags] = useState("");
  const [size] = useState<number>(20);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [after, setAfter] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const { user } = useAuth();
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const initialQ = searchParams.get("q");
    if (initialQ) {
      setQ(initialQ);
      executeSearch(initialQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const executeSearch = async (keyword: string) => {
    const text = keyword.trim();
    if (!text) return;
    if (!user) setShowLoginHint(true);
    setQ(text);
    setLoading(true);
    setSearched(true);
    try {
      const resp = await searchService.query({ q: text, size, tags: tags.trim() || undefined });
      setItems(resp.items ?? []);
      setAfter(resp.nextAfter ?? null);
      setHasMore(!!resp.hasMore);
    } catch {
      setItems([]);
      setAfter(null);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      header={
        <MainHeader
          headline="搜索你想学习的知识"
          subtitle="从提示词或你的历史记录开始探索，连接灵感与成长"
          rightSlot={<AuthStatus />}
        >
          <SearchBar
            placeholder="搜索你想学习的知识..."
            value={q}
            suggestions={suggestions}
            suggestLoading={suggestLoading}
            onSuggestionClick={(s) => executeSearch(s)}
            onChange={(val) => {
              setQ(val);
              if (debounceRef.current) window.clearTimeout(debounceRef.current);
              debounceRef.current = window.setTimeout(async () => {
                if (!val.trim()) { setSuggestions([]); return; }
                try {
                  setSuggestLoading(true);
                  const resp = await searchService.suggest(val.trim(), 10);
                  setSuggestions(resp.items ?? []);
                } catch {
                  setSuggestions([]);
                } finally {
                  setSuggestLoading(false);
                }
              }, 300);
            }}
            onSubmit={(val) => executeSearch(val)}
          />
        </MainHeader>
      }
    >
      <>
        {showLoginHint && !user ? (
          <div className={styles.loginHint}>
            当前为未登录状态，登录后可获得更完整的推荐与学习记录。
          </div>
        ) : null}

        <SectionHeader
          title="搜索结果"
          subtitle={
            loading
              ? "加载中…"
              : searched
                ? items.length
                  ? `共 ${items.length} 条结果`
                  : "未找到匹配内容"
                : "请输入关键词后搜索"
          }
        />

        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className={styles.grid}>
            {items.map(item => (
              <div key={item.id} className={styles.gridItem}>
                <CourseCard
                  id={item.id}
                  title={item.title}
                  summary={item.description ?? ""}
                  tags={item.tags ?? []}
                  isTop={item.isTop}
                  authorTags={(() => {
                    try {
                      return item.tagJson ? (JSON.parse(item.tagJson) as unknown[]).filter((t) => typeof t === "string") as string[] : [];
                    } catch {
                      return [];
                    }
                  })()}
                  teacher={{ name: item.authorNickname, avatarUrl: item.authorAvatar ?? item.authorAvator }}
                  coverImage={item.coverImage}
                  to={`/post/${item.id}`}
                  footerExtra={<LikeFavBar entityId={item.id} compact initialCounts={{ like: item.likeCount ?? 0, fav: item.favoriteCount ?? 0 }} initialState={{ liked: item.liked, faved: item.faved }} />}
                />
              </div>
            ))}
          </div>
        ) : searched ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <p className={styles.emptyTitle}>未找到相关内容</p>
            <p className={styles.emptyDesc}>换个关键词试试吧</p>
          </div>
        ) : null}

        {hasMore ? (
          <div className={styles.loadMoreWrap}>
            <button
              className={styles.loadMoreBtn}
              type="button"
              onClick={async () => {
                if (!q.trim() || !after) return;
                setLoading(true);
                try {
                  const resp = await searchService.query({ q: q.trim(), size, tags: tags.trim() || undefined, after });
                  setItems(prev => [...prev, ...(resp.items ?? [])]);
                  setAfter(resp.nextAfter ?? null);
                  setHasMore(!!resp.hasMore);
                } catch {
                  // 保持已有数据
                } finally {
                  setLoading(false);
                }
              }}
            >加载更多</button>
          </div>
        ) : null}
      </>
    </AppLayout>
  );
};

export default SearchPage;
