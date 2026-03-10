import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./AdminDashboardPage.module.css";

interface HealthStatus {
  status: string;
  components?: Record<string, { status: string; details?: Record<string, unknown> }>;
}

const INFRA_CARDS = [
  {
    id: "kafka",
    name: "Apache Kafka 4.0",
    role: "消息队列 / 异步削峰",
    config: ["acks=all", "retries=3", "linger=10ms"],
    desc: "Canal CDC 监听 outbox 表，binlog → Kafka → 异步消费落库，削峰防写入风暴",
    icon: "⚡",
    accent: "rgba(107, 140, 175, 0.15)",
  },
  {
    id: "redis",
    name: "Redis (Lettuce)",
    role: "二级缓存 + 分布式锁",
    config: ["max-active=16", "max-idle=8", "热点 50/200/500 QPM"],
    desc: "L1 Caffeine + L2 Redis 双层缓存，自动热点 Key 探测，命中率 >99%",
    icon: "🔥",
    accent: "rgba(74, 111, 148, 0.12)",
  },
  {
    id: "elasticsearch",
    name: "Elasticsearch 9.x",
    role: "全文检索引擎",
    config: ["localhost:9012", "中文分词", "倒排索引"],
    desc: "毫秒级中文全文检索，关键词高亮，相关性排序，支撑站内搜索核心功能",
    icon: "🔎",
    accent: "rgba(107, 140, 175, 0.15)",
  },
  {
    id: "mysql",
    name: "MySQL (HikariCP)",
    role: "主数据库",
    config: ["max-pool-size=20", "min-idle=5", "Outbox 模式"],
    desc: "事务一致性保障，Outbox 模式确保消息可靠投递，HikariCP 高性能连接池",
    icon: "🗄️",
    accent: "rgba(74, 111, 148, 0.12)",
  },
  {
    id: "deepseek",
    name: "DeepSeek V3",
    role: "AI 大模型",
    config: ["model=deepseek-chat", "流式生成", "RAG Pipeline"],
    desc: "知识库检索增强生成，向量相似度召回 + 大模型推理，精准回答技术问题",
    icon: "🤖",
    accent: "rgba(107, 140, 175, 0.15)",
  },
  {
    id: "canal",
    name: "Canal CDC",
    role: "变更数据捕获",
    config: ["localhost:11111", "监听 dengtai.outbox", "binlog 解析"],
    desc: "MySQL binlog → Kafka 事件流，实现最终一致性，解耦写操作与计数更新",
    icon: "🔄",
    accent: "rgba(74, 111, 148, 0.12)",
  },
  {
    id: "redisson",
    name: "Redisson 分布式锁",
    role: "分布式协调",
    config: ["rate=3 permits/10s", "RateLimiter", "防缓存击穿"],
    desc: "Counter rebuild 操作限流，防止缓存失效时并发重建导致的数据库雪崩",
    icon: "🛡️",
    accent: "rgba(107, 140, 175, 0.15)",
  },
  {
    id: "actuator",
    name: "Spring Actuator",
    role: "运维监控",
    config: ["/actuator/health", "permitAll", "可接 Prometheus"],
    desc: "实时健康检查端点，暴露应用状态供监控系统采集，支持对接 Grafana 大盘",
    icon: "📊",
    accent: "rgba(74, 111, 148, 0.12)",
  },
];

const JWT_CONFIG = [
  { label: "Access Token", value: "15 分钟" },
  { label: "Refresh Token", value: "7 天" },
  { label: "算法", value: "HS256" },
  { label: "双 Token 轮转", value: "已启用" },
];

const AdminDashboardPage = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("http://localhost:8082/actuator/health");
      const data: HealthStatus = await res.json();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const isUp = health?.status === "UP";

  return (
    <AppLayout
      header={
        <MainHeader
          headline="运维中枢"
          subtitle="后端基础设施实时状态"
          rightSlot={<AuthStatus />}
        />
      }
    >
      <div className={styles.container}>
        <div className={styles.topBar}>
          <div className={styles.topBarInfo}>
            <span className={styles.topBarLabel}>后端地址</span>
            <code className={styles.topBarCode}>localhost:8082</code>
            <span className={styles.topBarDivider}>·</span>
            <span className={styles.topBarLabel}>
              上次刷新 {lastRefresh.toLocaleTimeString("zh-CN")}
            </span>
          </div>
          <button className={styles.refreshBtn} onClick={fetchHealth} disabled={healthLoading}>
            {healthLoading ? "检测中…" : "刷新状态"}
          </button>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>系统健康</h2>
          <div className={styles.healthPanel}>
            <div className={styles.healthOverall}>
              <div
                className={styles.healthDot}
                data-status={healthLoading ? "loading" : isUp ? "up" : "down"}
              />
              <div className={styles.healthOverallText}>
                <span className={styles.healthStatusLabel}>
                  {healthLoading ? "检测中…" : isUp ? "系统正常" : health ? "服务异常" : "无法连接"}
                </span>
                <span className={styles.healthStatusSub}>
                  {healthLoading ? "正在连接后端" : isUp ? "所有核心服务运行中" : "请检查后端服务"}
                </span>
              </div>
              {!healthLoading && health && (
                <span className={styles.healthBadge} data-up={isUp}>
                  {health.status}
                </span>
              )}
            </div>

            {health?.components && (
              <div className={styles.healthComponents}>
                {Object.entries(health.components).map(([name, comp]) => (
                  <div key={name} className={styles.healthComp} data-up={comp.status === "UP"}>
                    <div
                      className={styles.healthCompDot}
                      data-up={comp.status === "UP"}
                    />
                    <span className={styles.healthCompName}>{name}</span>
                    <span className={styles.healthCompStatus}>{comp.status}</span>
                  </div>
                ))}
              </div>
            )}

            {!healthLoading && !health && (
              <div className={styles.healthError}>
                无法连接到后端 — 请确认 Spring Boot 应用运行在 localhost:8082
              </div>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>大杀器全景</h2>
          <p className={styles.sectionSubtitle}>8 个核心组件，共同支撑亿级流量架构</p>
          <div className={styles.infraGrid}>
            {INFRA_CARDS.map((card) => (
              <div key={card.id} className={styles.infraCard} style={{ "--card-accent": card.accent } as React.CSSProperties}>
                <div className={styles.infraCardHeader}>
                  <span className={styles.infraIcon}>{card.icon}</span>
                  <div className={styles.infraCardMeta}>
                    <h3 className={styles.infraName}>{card.name}</h3>
                    <span className={styles.infraRole}>{card.role}</span>
                  </div>
                </div>
                <p className={styles.infraDesc}>{card.desc}</p>
                <div className={styles.infraConfigs}>
                  {card.config.map((c) => (
                    <code key={c} className={styles.infraConfigChip}>{c}</code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.bottomRow}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>JWT 安全配置</h2>
            <div className={styles.jwtPanel}>
              {JWT_CONFIG.map((item) => (
                <div key={item.label} className={styles.jwtItem}>
                  <span className={styles.jwtLabel}>{item.label}</span>
                  <span className={styles.jwtValue}>{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>API 文档</h2>
            <div className={styles.apiPanel}>
              <a
                className={styles.apiLink}
                href="http://localhost:8082/swagger-ui.html"
                target="_blank"
                rel="noreferrer"
              >
                <span className={styles.apiLinkIcon}>📄</span>
                <span className={styles.apiLinkText}>
                  <span className={styles.apiLinkTitle}>Swagger UI</span>
                  <span className={styles.apiLinkUrl}>localhost:8082/swagger-ui.html</span>
                </span>
                <span className={styles.apiLinkArrow}>↗</span>
              </a>
              <div className={styles.apiDivider} />
              <a
                className={styles.apiLink}
                href="http://localhost:8082/v3/api-docs"
                target="_blank"
                rel="noreferrer"
              >
                <span className={styles.apiLinkIcon}>🔗</span>
                <span className={styles.apiLinkText}>
                  <span className={styles.apiLinkTitle}>OpenAPI JSON</span>
                  <span className={styles.apiLinkUrl}>localhost:8082/v3/api-docs</span>
                </span>
                <span className={styles.apiLinkArrow}>↗</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboardPage;
