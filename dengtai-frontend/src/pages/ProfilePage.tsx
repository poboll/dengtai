import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import SectionHeader from "@/components/common/SectionHeader";
import { mockContents } from "@/data/content";
import AuthStatus from "@/features/auth/AuthStatus";
import { useAuth } from "@/context/AuthContext";
import styles from "./ProfilePage.module.css";

const tabs = [
  { id: "profile", label: "个人信息" },
  { id: "contents", label: "我的内容" }
];

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const { user } = useAuth();
  const displayName = user?.nickname ?? user?.phone ?? user?.email ?? "灯塔用户";
  const avatarInitial = displayName.trim().charAt(0) || "知";

  const myContents = useMemo(
    () => mockContents.filter(item => item.mentor.id === "kana"),
    []
  );

  return (
    <AppLayout
      header={
        <MainHeader
          headline="我的灯塔主页"
          subtitle="完善个人信息，积累你的知识资产"
          rightSlot={<AuthStatus />}
        >
          <div className={styles.tabs}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabActive : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </MainHeader>
      }
    >
      {activeTab === "profile" ? (
        <>
          <SectionHeader title="个人信息" subtitle="让同学们更快认识你" />
          <div className={styles.avatarLarge}>{avatarInitial}</div>
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">邮箱</label>
              <input id="email" className={styles.input} defaultValue="" placeholder="绑定邮箱以便接收通知" />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">姓名</label>
              <input id="name" className={styles.input} defaultValue={displayName} placeholder="填写你的真实姓名或昵称" />
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label} htmlFor="bio">个人简介</label>
              <textarea id="bio" className={styles.textarea} placeholder="介绍一下自己..." />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="tag">擅长领域</label>
              <input id="tag" className={styles.input} placeholder="输入擅长领域和标签" />
            </div>
          </div>
          <button type="button" className="ghost-button" style={{ alignSelf: "flex-end" }}>保存修改</button>
        </>
      ) : (
        <>
          <SectionHeader title="我的内容" subtitle="管理你的作品，了解互动和数据" />
          <ul className={styles.contentList}>
            {myContents.map(item => (
              <li key={item.id} className={styles.contentItem}>
                <div className={styles.contentMeta}>
                  <Link to={`/course/${item.id}`} className={styles.contentTitle}>{item.title}</Link>
                  <div className={styles.contentStats}>
                    <span>👁️ {item.views} 次浏览</span>
                    <span>🛒 0 次购买</span>
                    <span>👍 {item.likes} 次点赞</span>
                  </div>
                </div>
                <div className={styles.contentActions}>
                  <button type="button" className={styles.smallButton}>编辑</button>
                  <button type="button" className={`${styles.smallButton} ${styles.danger}`}>删除</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </AppLayout>
  );
};

export default ProfilePage;
