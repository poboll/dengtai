import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./AboutPage.module.css";

const FEATURES = [
  { icon: "📝", title: "知文创作", desc: "支持 Markdown 富文本编写，一键发布技术分享" },
  { icon: "🤖", title: "AI 智能问答", desc: "DeepSeek 大模型 + RAG 知识库检索，精准解答" },
  { icon: "🔍", title: "全文搜索", desc: "Elasticsearch 驱动，毫秒级全文检索" },
  { icon: "❤️", title: "社交互动", desc: "点赞、收藏、关注，构建技术社交圈" },
  { icon: "🎯", title: "个性推荐", desc: "基于兴趣标签的智能内容推荐" },
  { icon: "🔐", title: "安全可靠", desc: "JWT 双 Token 认证，企业级安全架构" },
];

const TECH_STACK = [
  { name: "React 18", role: "前端框架", sub: "TypeScript + Vite" },
  { name: "Spring Boot 3.4", role: "后端框架", sub: "Java 21 LTS" },
  { name: "MySQL + Redis", role: "数据层", sub: "持久化 & 缓存" },
  { name: "Elasticsearch 9.x", role: "搜索引擎", sub: "全文检索" },
  { name: "DeepSeek V3", role: "AI 引擎", sub: "RAG Pipeline" },
  { name: "Apache Kafka 4.0", role: "消息队列", sub: "异步处理" },
  { name: "七牛云 Kodo", role: "对象存储", sub: "CDN 加速" },
  { name: "Spring Actuator", role: "运维监控", sub: "健康检查" },
];

const AboutPage = () => (
  <AppLayout
    header={
      <MainHeader
        headline="关于灯塔"
        subtitle="让思想有温度，让知识会发光"
        rightSlot={<AuthStatus />}
      />
    }
  >
    <div className={styles.container}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroIcon}>🏮</div>
        <h1 className={styles.heroTitle}>灯塔</h1>
        <p className={styles.heroSlogan}>让思想有温度，让知识会发光</p>
        <p className={styles.heroDesc}>
          灯塔是一个面向开发者的知识分享与智能问答平台，融合 AI 大模型与 RAG 检索增强技术，
          为技术社区提供高质量的内容创作、发现与交流体验。
        </p>
      </section>

      {/* 核心功能 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>核心功能</h2>
        <div className={styles.featureGrid}>
          {FEATURES.map(f => (
            <div key={f.title} className={styles.featureCard}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureName}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>技术架构</h2>
        <div className={styles.techGrid}>
          {TECH_STACK.map(t => (
            <div key={t.name} className={styles.techCard}>
              <span className={styles.techRole}>{t.role}</span>
              <h3 className={styles.techName}>{t.name}</h3>
              <span className={styles.techSub}>{t.sub}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>开源信息</h2>
        <div className={styles.openSource}>
          <div className={styles.osItem}>
            <span className={styles.osLabel}>GitHub</span>
            <a className={styles.osLink} href="https://github.com/poboll/dengtai" target="_blank" rel="noreferrer">
              github.com/poboll/dengtai
            </a>
          </div>
          <div className={styles.osItem}>
            <span className={styles.osLabel}>License</span>
            <span className={styles.osValue}>MIT License</span>
          </div>
          <div className={styles.osItem}>
            <span className={styles.osLabel}>Author</span>
            <span className={styles.osValue}>poboll</span>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>灯塔 Dengtai · v1.0.0</span>
      </footer>
    </div>
  </AppLayout>
);

export default AboutPage;