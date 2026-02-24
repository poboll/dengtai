import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import AuthStatus from "@/features/auth/AuthStatus";
import CourseCard from "@/components/cards/CourseCard";
import LikeFavBar from "@/components/common/LikeFavBar";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { knowpostService } from "@/services/knowpostService";
import type { FeedItem } from "@/types/knowpost";
import styles from "./LearningPage.module.css";

const SKELETON_COUNT = 6;

const LearningPage = () => {
  const { user, tokens } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [posts, setPosts] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchMyPosts = useCallback(async () => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    try {
      const resp = await knowpostService.mine(1, 50, tokens.accessToken);
      setPosts(resp.items ?? []);
    } catch {
      // 静默失败，保持空列表
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [tokens?.accessToken]);

  useEffect(() => { fetchMyPosts(); }, [fetchMyPosts]);

  const handlePostChanged = (postId: string, action: "top" | "visibility" | "delete") => {
    if (action === "delete") {
      setPosts(prev => prev.filter(p => p.id !== postId));
    } else {
      fetchMyPosts();
    }
  };

  const notLoggedIn = !user;

  return (
    <AppLayout
      header={
        <MainHeader
          headline="我的创作"
          subtitle="管理你发布的知文，记录每一次知识分享"
          rightSlot={<AuthStatus />}
        />
      }
    >
      {notLoggedIn ? (
        <div className={styles.emptyCard}>
          <div className={styles.icon}>🔒</div>
          <div className={styles.title}>请先登录</div>
          <div className={styles.description}>登录后查看你的创作内容</div>
          <button type="button" className="ghost-button" onClick={() => openAuthModal("login")}>
            立即登录
          </button>
        </div>
      ) : loading ? (
        <div className={styles.grid}>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      ) : loaded && posts.length === 0 ? (
        <div className={styles.emptyCard}>
          <div className={styles.icon}>📚</div>
          <div className={styles.title}>还没有创作内容</div>
          <div className={styles.description}>去创作你的第一篇知文吧</div>
          <Link to="/create" className="ghost-button" style={{ textDecoration: "none" }}>
            开始创作
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {posts.map((post) => (
            <div key={post.id} className={styles.gridItem}>
              <CourseCard
                id={post.id}
                title={post.title}
                summary={post.description ?? ""}
                tags={post.tags ?? []}
                isTop={post.isTop}
                authorTags={(() => {
                  try {
                    return post.tagJson ? (JSON.parse(post.tagJson) as unknown[]).filter(t => typeof t === "string") as string[] : [];
                  } catch { return []; }
                })()}
                teacher={{ name: post.authorNickname, avatarUrl: post.authorAvatar ?? post.authorAvator }}
                coverImage={post.coverImage}
                to={`/post/${post.id}`}
                editable
                onChanged={(action) => handlePostChanged(post.id, action)}
                footerExtra={
                  <LikeFavBar
                    entityId={post.id}
                    compact
                    initialCounts={{ like: post.likeCount ?? 0, fav: post.favoriteCount ?? 0 }}
                    initialState={{ liked: post.liked, faved: post.faved }}
                  />
                }
              />
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default LearningPage;
