import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import AuthStatus from "@/features/auth/AuthStatus";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { knowpostService } from "@/services/knowpostService";
import type { FeedItem } from "@/types/knowpost";
import styles from "./LearningPage.module.css";

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

  const notLoggedIn = !user;

  return (
    <AppLayout
      header={
        <MainHeader
          headline="我的学习"
          subtitle="记录每一次学习进步，保持持续成长"
          rightSlot={<AuthStatus />}
        />
      }
    >
      {notLoggedIn ? (
        <div className={styles.emptyCard}>
          <div className={styles.icon}>🔒</div>
          <div className={styles.title}>请先登录</div>
          <div className={styles.description}>登录后查看你的创作和学习记录</div>
          <button type="button" className="ghost-button" onClick={() => openAuthModal("login")}>
            立即登录
          </button>
        </div>
      ) : loading ? (
        <div className={styles.emptyCard}>
          <div className={styles.icon}>⏳</div>
          <div className={styles.title}>加载中...</div>
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
            <Link key={post.id} to={`/post/${post.id}`} className={styles.card}>
              {post.coverImage && (
                <img src={post.coverImage} alt={post.title} className={styles.cover} />
              )}
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{post.title}</h3>
                {post.description && (
                  <p className={styles.cardDesc}>{post.description}</p>
                )}
                <div className={styles.cardMeta}>
                  {post.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className={styles.tag}>#{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default LearningPage;
