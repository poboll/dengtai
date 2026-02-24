import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import type { HeaderTab } from "@/components/layout/MainHeader";
import CourseCard from "@/components/cards/CourseCard";
import LikeFavBar from "@/components/common/LikeFavBar";
import AuthStatus from "@/features/auth/AuthStatus";
import { knowpostService } from "@/services/knowpostService";
import styles from "./LearningPage.module.css";

const SKELETON_COUNT = 9;

const CATEGORY_TABS: Array<{ id: string; label: string }> = [
  { id: "all", label: "全部" },
  { id: "java", label: "Java" },
  { id: "frontend", label: "前端" },
  { id: "ai", label: "AI/ML" },
  { id: "algo", label: "算法" },
  { id: "devops", label: "DevOps" },
  { id: "design", label: "设计" },
  { id: "security", label: "安全" },
];

const CATEGORY_TAG_MAP: Record<string, string[]> = {
  all: [],
  java: ["Java", "后端", "架构", "Spring Boot", "微服务"],
  frontend: ["前端", "Vue", "React", "TypeScript", "Vite", "框架"],
  ai: ["AI", "GPT", "Claude", "DeepSeek", "机器学习", "Agent", "RAG"],
  algo: ["算法", "竞赛", "LeetCode", "数据结构"],
  devops: ["DevOps", "K8s", "容器", "云原生", "Docker"],
  design: ["设计", "UI", "产品"],
  security: ["安全", "DevSecOps"],
};

type LearningPath = { title: string; desc: string; icon: string; tags: string[] };
const LEARNING_PATHS: LearningPath[] = [
  { title: "Java 后端进阶", desc: "从基础到架构设计", icon: "☕", tags: ["Java", "Spring Boot", "微服务"] },
  { title: "前端工程化", desc: "现代前端开发全流程", icon: "⚛️", tags: ["React", "TypeScript", "Vite"] },
  { title: "AI 应用开发", desc: "大模型 & RAG 实战", icon: "🤖", tags: ["AI", "DeepSeek", "RAG"] },
  { title: "算法与数据结构", desc: "面试必备核心知识", icon: "🧮", tags: ["算法", "LeetCode"] },
];

const HOT_TAGS = [
  "Spring Boot", "React", "TypeScript", "AI", "DeepSeek",
  "算法", "微服务", "Docker", "K8s", "RAG", "LeetCode", "系统设计",
];

type FeedItem = {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  tags: string[];
  tagJson?: string;
  authorAvatar?: string;
  authorAvator?: string;
  authorNickname: string;
  likeCount?: number;
  favoriteCount?: number;
  liked?: boolean;
  faved?: boolean;
};

const LearningPage = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return items;
    const matchTags = CATEGORY_TAG_MAP[activeTab] ?? [];
    if (!matchTags.length) return items;
    return items.filter(item =>
      item.tags?.some(t => matchTags.some(m => t.includes(m)))
    );
  }, [items, activeTab]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await knowpostService.feed(1, 30);
        if (!cancelled) setItems(resp.items ?? []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "加载失败";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const tabs: HeaderTab[] = CATEGORY_TABS.map(t => ({
    id: t.id,
    label: t.label,
    active: t.id === activeTab,
    onSelect: (id: string) => setActiveTab(id),
  }));

  const handleTagClick = (tag: string) => navigate(`/search?q=${encodeURIComponent(tag)}`);

  return (
    <AppLayout
      header={
        <MainHeader
          headline="学习广场"
          subtitle="发现优质内容，开启你的技术成长之路"
          tabs={tabs}
          rightSlot={<AuthStatus />}
        />
      }
    >
      <div className={styles.layout}>
        {/* ── 主内容区 ── */}
        <main className={styles.main}>
          {error ? <div className={styles.error}>{error}</div> : null}
          <div className={styles.grid}>
            {loading
              ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <div key={i} className={styles.gridItem}>
                    <div className={styles.skeletonCard} />
                  </div>
                ))
              : filteredItems.map(item => (
                  <div key={item.id} className={styles.gridItem}>
                    <CourseCard
                      id={item.id}
                      title={item.title}
                      summary={item.description ?? ""}
                      tags={item.tags ?? []}
                      authorTags={(() => {
                        try {
                          return item.tagJson
                            ? (JSON.parse(item.tagJson) as unknown[]).filter(t => typeof t === "string") as string[]
                            : [];
                        } catch { return []; }
                      })()}
                      teacher={{ name: item.authorNickname, avatarUrl: item.authorAvatar ?? item.authorAvator }}
                      coverImage={item.coverImage}
                      to={`/post/${item.id}`}
                      footerExtra={
                        <LikeFavBar
                          entityId={item.id}
                          compact
                          initialCounts={{ like: item.likeCount ?? 0, fav: item.favoriteCount ?? 0 }}
                          initialState={{ liked: item.liked, faved: item.faved }}
                        />
                      }
                      onTagClick={handleTagClick}
                    />
                  </div>
                ))}
            {!loading && filteredItems.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>📚</div>
                <p>该分类暂无内容，换个分类看看吧</p>
              </div>
            ) : null}
          </div>
        </main>

        {/* ── 右侧面板 ── */}
        <aside className={styles.sidebar}>
          {/* 学习路径推荐 */}
          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>学习路径</h3>
            <div className={styles.pathList}>
              {LEARNING_PATHS.map(p => (
                <div key={p.title} className={styles.pathCard} onClick={() => handleTagClick(p.tags[0])}>
                  <span className={styles.pathIcon}>{p.icon}</span>
                  <div className={styles.pathInfo}>
                    <span className={styles.pathName}>{p.title}</span>
                    <span className={styles.pathDesc}>{p.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 热门标签云 */}
          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>热门标签</h3>
            <div className={styles.tagCloud}>
              {HOT_TAGS.map(tag => (
                <span key={tag} className={styles.tagItem} onClick={() => handleTagClick(tag)} role="link" tabIndex={0}>
                  {tag}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </AppLayout>
  );
};

export default LearningPage;
