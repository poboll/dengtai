import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import AuthStatus from "@/features/auth/AuthStatus";
import { LighthouseIcon } from "@/components/icons/Icon";
import styles from "./AboutPage.module.css";

const STATS = [
  { value: "8+", label: "核心技术栈" },
  { value: "亿级", label: "流量架构" },
  { value: "毫秒级", label: "AI 响应" },
  { value: "企业级", label: "安全标准" },
];

const FEATURES = [
  { icon: "📝", title: "知文创作", desc: "Markdown 富文本编写，一键发布技术分享，支持代码高亮与图片上传" },
  { icon: "🤖", title: "AI 智能问答", desc: "DeepSeek V3 大模型 + RAG 知识库检索，精准解答技术问题" },
  { icon: "🔍", title: "全文搜索", desc: "Elasticsearch 9.x 驱动，中文分词，毫秒级全文检索响应" },
  { icon: "❤️", title: "社交互动", desc: "点赞、收藏、关注，异步���数器架构，构建技术社交生态" },
  { icon: "🎯", title: "个性推荐", desc: "基于兴趣标签的智能内容推荐，向量相似度匹配" },
  { icon: "🔐", title: "安全可靠", desc: "JWT 双 Token 认证，Access 15分钟 + Refresh 7天轮转" },
];

const ARCH_LAYERS = [
  {
    layer: "前端层",
    layerEn: "Frontend",
    color: "rgba(107, 140, 175, 0.12)",
    chips: ["React 18", "TypeScript", "Vite 5", "React Router"],
  },
  {
    layer: "后端层",
    layerEn: "Backend",
    color: "rgba(74, 111, 148, 0.10)",
    chips: ["Spring Boot 3.4", "Java 21 LTS", "JWT Auth", "Canal CDC"],
  },
  {
    layer: "数据层",
    layerEn: "Data",
    color: "rgba(143, 168, 194, 0.12)",
    chips: ["MySQL · HikariCP", "Redis L2 Cache", "Elasticsearch 9.x", "Redisson 锁"],
  },
  {
    layer: "AI 引擎",
    layerEn: "AI",
    color: "rgba(74, 111, 148, 0.08)",
    chips: ["DeepSeek V3", "RAG Pipeline", "BGE Embedding", "流式生成"],
  },
  {
    layer: "基础设施",
    layerEn: "Infra",
    color: "rgba(107, 140, 175, 0.08)",
    chips: ["Kafka 4.0 · acks=all", "七牛云 Kodo OSS", "Spring Actuator", "HikariCP"],
  },
];

const INFRA_HIGHLIGHTS = [
  {
    icon: "⚡",
    title: "Kafka 异步削峰",
    desc: "点赞/收藏操作通过 Outbox 模式写入 MySQL，Canal CDC 监听 binlog 推送 Kafka，异步消费落库，彻底避免写入风暴，支持百万级并发交互。",
  },
  {
    icon: "🔥",
    title: "Redis 二级缓存 + 热点探测",
    desc: "L1 Caffeine 本地缓存 + L2 Redis 分布式缓存双层防护。自动探测热点 Key（阈值 50/200/500 QPM），热点命中率 >99%，大幅降低数据库压力。",
  },
  {
    icon: "🔎",
    title: "Elasticsearch 全文检索",
    desc: "中文分词 + 倒排索引，毫秒级召回。支持关键词高亮、相关性排序，搜索体验媲美商业产品。",
  },
  {
    icon: "🛡️",
    title: "Redisson 分布式锁防击穿",
    desc: "Counter rebuild 操作使用 Redisson RateLimiter 限流（3 permits/10s），防止缓存失效时并发重建导致的数据库雪崩。",
  },
];

const AboutPage = () => (
  <AppLayout
    header={
      <MainHeader
        headline="关于灯塔"
        subtitle="以知识为光，照亮每一程"
        rightSlot={<AuthStatus />}
      />
    }
  >
    <div className={styles.container}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroIconWrap}>
          <LighthouseIcon width={40} height={40} stroke="none" fill="#fff" />
        </div>
        <h1 className={styles.heroTitle}>灯塔</h1>
        <p className={styles.heroSlogan}>以知识为光，照亮每一程</p>
        <p className={styles.heroDesc}>
          面向开发者的知识分享与智能问答平台，融合 AI 大模型与 RAG 检索增强技术，
          为技术社区提供高质量的内容创作、发现与交流体验。
        </p>

        <div className={styles.statsRow}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.statItem}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.heroCtas}>
          <Link to="/admin" className={styles.ctaPrimary}>
            查看后台 →
          </Link>
          <a
            href="https://github.com/poboll/dengtai"
            target="_blank"
            rel="noreferrer"
            className={styles.ctaGhost}
          >
            GitHub ↗
          </a>
        </div>
      </section>

      {/* ── 核心功能 ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>核心功能</h2>
        <div className={styles.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <span className={styles.featureIcon}>{f.icon}</span>
              </div>
              <h3 className={styles.featureName}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 技术架构分层 ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>技术架构</h2>
        <div className={styles.archStack}>
          {ARCH_LAYERS.map((layer) => (
            <div
              key={layer.layerEn}
              className={styles.archLayer}
              style={{ background: layer.color }}
            >
              <div className={styles.archLayerLabel}>
                <span className={styles.archLayerName}>{layer.layer}</span>
                <span className={styles.archLayerEn}>{layer.layerEn}</span>
              </div>
              <div className={styles.archChips}>
                {layer.chips.map((chip) => (
                  <span key={chip} className={styles.archChip}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 亿级流量架构说明 ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>亿级流量架构 — 这些大杀器真的���用吗？</h2>
        <p className={styles.sectionSubtitle}>
          每一个基础设施组件都解决真实的高并发场景问题，以下是它们的核心价值：
        </p>
        <div className={styles.infraGrid}>
          {INFRA_HIGHLIGHTS.map((item) => (
            <div key={item.title} className={styles.infraCard}>
              <span className={styles.infraIcon}>{item.icon}</span>
              <h3 className={styles.infraTitle}>{item.title}</h3>
              <p className={styles.infraDesc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 开源信息 ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>开源信息</h2>
        <div className={styles.openSource}>
          <div className={styles.osItem}>
            <span className={styles.osLabel}>GitHub</span>
            <a
              className={styles.osLink}
              href="https://github.com/poboll/dengtai"
              target="_blank"
              rel="noreferrer"
            >
              github.com/poboll/dengtai
            </a>
          </div>
          <div className={styles.osDivider} />
          <div className={styles.osItem}>
            <span className={styles.osLabel}>License</span>
            <span className={styles.osValue}>MIT License</span>
          </div>
          <div className={styles.osDivider} />
          <div className={styles.osItem}>
            <span className={styles.osLabel}>Author</span>
            <span className={styles.osValue}>poboll</span>
          </div>
          <div className={styles.osDivider} />
          <div className={styles.osItem}>
            <span className={styles.osLabel}>Version</span>
            <span className={styles.osValue}>v1.0.0</span>
          </div>
        </div>
      </section>

      <footer className={styles.pageFooter}>
        灯塔 Dengtai · v1.0.0 · MIT License
      </footer>
    </div>
  </AppLayout>
);

export default AboutPage;
