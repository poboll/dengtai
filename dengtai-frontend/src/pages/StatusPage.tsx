import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./StatusPage.module.css";

const COMPONENTS = [
  { name: "Spring Boot", version: "3.4.x", desc: "后端核心框架", icon: "☕" },
  { name: "Java", version: "21 LTS", desc: "运行时环境", icon: "☕" },
  { name: "MySQL", version: "8.x", desc: "关系型数据库", icon: "🗄️" },
  { name: "Redis", version: "7.x", desc: "缓存 & 会话存储", icon: "⚡" },
  { name: "Elasticsearch", version: "9.x", desc: "全文搜索引擎", icon: "🔍" },
  { name: "Apache Kafka", version: "4.0", desc: "消息队列", icon: "📨" },
  { name: "React", version: "18.x", desc: "前端框架", icon: "⚛️" },
  { name: "TypeScript", version: "5.x", desc: "类型安全", icon: "📘" },
  { name: "Vite", version: "6.x", desc: "前端构建工具", icon: "⚡" },
  { name: "DeepSeek AI", version: "V3", desc: "大语言模型", icon: "🤖" },
  { name: "七牛云 Kodo", version: "-", desc: "对象存储", icon: "☁️" },
  { name: "Spring Actuator", version: "-", desc: "健康监控", icon: "📊" },
];

type HealthStatus = "loading" | "up" | "down";

const StatusPage = () => {
  const [health, setHealth] = useState<HealthStatus>("loading");
  const [checkedAt, setCheckedAt] = useState<string>("");

  useEffect(() => {
    fetch("/actuator/health")
      .then(r => r.json())
      .then(d => {
        setHealth(d.status === "UP" ? "up" : "down");
        setCheckedAt(new Date().toLocaleString("zh-CN"));
      })
      .catch(() => {
        setHealth("down");
        setCheckedAt(new Date().toLocaleString("zh-CN"));
      });
  }, []);
  const statusLabel = health === "loading" ? "检测中..." : health === "up" ? "所有系统运行正常" : "系统异常";
  return (
    <AppLayout
      header={<MainHeader headline="系统状态" subtitle="灯塔平台基础设施监控面板" rightSlot={<AuthStatus />} />}
    >
      <div className={styles.container}>
        <div className={`${styles.banner} ${styles[health]}`}>
          <span className={styles.pulse} />
          <span className={styles.bannerText}>{statusLabel}</span>
          {checkedAt && <span className={styles.checkedAt}>最后检测: {checkedAt}</span>}
        </div>
        <div className={styles.grid}>
          {COMPONENTS.map((c, i) => (
            <div key={c.name} className={styles.card} style={{ animationDelay: `${i * 60}ms` }}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>{c.icon}</span>
                <span className={`${styles.dot} ${styles[health === "loading" ? "unknown" : "up"]}`} />
              </div>
              <h3 className={styles.cardName}>{c.name}</h3>
              <span className={styles.cardVersion}>{c.version}</span>
              <span className={styles.cardDesc}>{c.desc}</span>
            </div>
          ))}
        </div>
        <section className={styles.archSection}>
          <h2 className={styles.archTitle}>系统架构概览</h2>
          <p className={styles.archDesc}>
            灯塔采用前后端分离架构，React SPA 通过 Vite 构建，Spring Boot 提供 RESTful API。
            数据层使用 MySQL 持久化 + Redis 缓存，Elasticsearch 提供全文检索，
            Kafka 处理异步事件，DeepSeek AI 驱动 RAG 智能问答。
          </p>
        </section>
      </div>
    </AppLayout>
  );
};
export default StatusPage;