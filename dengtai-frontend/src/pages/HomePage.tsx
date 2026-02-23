import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import type { HeaderTab } from "@/components/layout/MainHeader";
import CourseCard from "@/components/cards/CourseCard";
import LikeFavBar from "@/components/common/LikeFavBar";
import { knowpostService } from "@/services/knowpostService";
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./HomePage.module.css";

const SKELETON_COUNT = 8;

const CATEGORY_TABS: Array<{ id: string; label: string }> = [
  { id: "all", label: "推荐" },
  { id: "java", label: "Java" },
  { id: "frontend", label: "前端" },
  { id: "ai", label: "AI/ML" },
  { id: "algo", label: "算法" },
  { id: "devops", label: "DevOps" },
  { id: "design", label: "设计" },
  { id: "security", label: "安全" },
];

const HOT_TOPICS = ["#系统设计", "#LeetCode", "#React", "#Java面试", "#大模型", "#K8s"];

type Creator = { name: string; desc: string; count: number };
const ACTIVE_CREATORS: Creator[] = [
  { name: "陈晓明", desc: "Java · 系统设计", count: 2841 },
  { name: "王宇轩", desc: "AI/ML · Python", count: 1923 },
  { name: "刘子涵", desc: "算法 · 竞赛", count: 1476 },
];

const PLATFORM_STATS = [
  { label: "创作者", value: "2,847" },
  { label: "知文", value: "18,392" },
  { label: "���周新增", value: "234" },
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

const HomePage = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await knowpostService.feed(1, 20);
        if (!cancelled) {
          setItems(resp.items ?? []);
        }
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

  return (
    <AppLayout
      header={
        <MainHeader
          headline="灯塔"
          subtitle="让思想有温度，让知识会发光"
          tabs={tabs}
          rightSlot={<AuthStatus />}
        />
      }
    >
      <div className={styles.layout}>
        {/* ── 主内容流 ── */}
        <main className={styles.main}>
          {error ? <div className={styles.error}>{error}</div> : null}
          <div className={styles.masonry}>
            {loading
              ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <div key={i} className={styles.masonryItem}>
                    <div className={styles.skeletonCard} />
                  </div>
                ))
              : items.map(item => (
                  <div key={item.id} className={styles.masonryItem}>
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
                    />
                  </div>
                ))}
            {!loading && items.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🔭</div>
                <p>暂无内容，快去创作第一篇知文吧</p>
              </div>
            ) : null}
          </div>
        </main>

        {/* ── 右侧面板 ── */}
        <aside className={styles.sidebar}>
          {/* 热门话题 */}
          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>热门话题</h3>
            <div className={styles.topicList}>
              {HOT_TOPICS.map(topic => (
                <span key={topic} className={styles.topicTag}>{topic}</span>
              ))}
            </div>
          </section>

          {/* 活跃创作者 */}
          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>活跃创作者</h3>
            <div className={styles.creatorList}>
              {ACTIVE_CREATORS.map((c, i) => (
                <div key={i} className={styles.creatorItem}>
                  <div className={styles.creatorAvatar}>
                    {c.name.charAt(0)}
                  </div>
                  <div className={styles.creatorInfo}>
                    <span className={styles.creatorName}>{c.name}</span>
                    <span className={styles.creatorDesc}>{c.desc}</span>
                  </div>
                  <span className={styles.creatorCount}>{c.count.toLocaleString()} 关注</span>
                </div>
              ))}
            </div>
          </section>

          {/* 平台数据 */}
          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>平台数据</h3>
            <div className={styles.statsList}>
              {PLATFORM_STATS.map(s => (
                <div key={s.label} className={styles.statItem}>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </AppLayout>
  );
};

export default HomePage;
