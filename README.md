<div align="center">

# 🔭 灯塔 · DengTai

**高并发知识社区平台 — 全链路工程实践**

[![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![Elasticsearch](https://img.shields.io/badge/Elasticsearch-9.3-005571?logo=elasticsearch)](https://www.elastic.co/)
[![Kafka](https://img.shields.io/badge/Kafka-4.0-231F20?logo=apachekafka)](https://kafka.apache.org/)
[![Redis](https://img.shields.io/badge/Redis-8.0-DC382D?logo=redis)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

> 一个面向**高并发读写**场景设计的知识社区平台，覆盖认证、内容创作、社交关系、智能检索、RAG 问答等完整业务链路，深度践行大厂级工程规范。

</div>

---

## 📐 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        React + Vite 前端                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP / REST
┌───────────────────────────▼─────────────────────────────────────┐
│                    Spring Boot 3 单体服务                         │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  auth    │ │ knowpost │ │ counter  │ │ relation │           │
│  │  模块    │ │  灯文    │ │  计数    │ │  关系    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ storage  │ │  search  │ │   llm    │ │  cache   │           │
│  │  存储    │ │  搜索    │ │ AI 问答  │ │  缓存    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└───────┬───────────┬────────────┬────────────┬────────────────────┘
        │           │            │            │
   ┌────▼───┐  ┌────▼──┐  ┌─────▼──┐   ┌────▼──────┐
   │ MySQL  │  │ Redis │  │ Kafka  │   │  七牛云   │
   └────────┘  └───────┘  └────────┘   │   Kodo    │
        │                      │        └───────────┘
   ┌────▼──────────────────────▼──┐
   │      Canal (CDC)              │
   │  outbox → relation / search  │
   └──────────────────────────────┘
        │
   ┌────▼───────────────────────────┐
   │  Elasticsearch 9               │
   │  向量索引 + 全文索引             │
   └────────────────────────────────┘
```

---

## ✨ 核心技术亮点

### 🔐 认证系统 — JWT RS256 双令牌

- **非对称签名**：采用 RSA RS256 算法，私钥签发、公钥验签，资源服务器无需共享密钥
- **双令牌机制**：Access Token（15 min）+ Refresh Token（7 day），支持无感续期
- **BCrypt 加密**：密码强度 12，防彩虹表攻击
- **验证码防刷**：发送间隔限流 + 每日上限 + TTL 自动过期，三重防护

### 📊 计数系统 — Redis SDS 位图 + Kafka 聚合写

- **位图幂等**：点赞/收藏写入 Redis Bitmap，天然幂等，O(1) 查询单用户状态
- **Kafka 聚合写**：计数变更发往 Kafka，Consumer 批量聚合后写 MySQL，消峰削谷
- **采样一致性校验**：定期对比 Redis 与 MySQL 计数，自动修复漂移
- **灾难回放**：Kafka offset 手动提交，宕机后从断点继续，零丢失

### 📝 灯文系统 — 七牛云直传 + AI 摘要

- **上传凭证直传**：服务端签发七牛云 Upload Token，前端直传至 Kodo，带宽压力降至零
- **DeepSeek 摘要**：发布时自动调用 DeepSeek AI 生成内容摘要，写入 ES 向量索引

### 👥 社交关系系统 — Canal + Outbox 模式

- **Outbox 事务**：关注/取关与业务数据同库事务提交，Canal 订阅 binlog 异步推送
- **Redisson 分布式锁**：防止并发关注同一用户产生竞态，TTL + 看门狗自动续期

### 🚀 Feed 流 — 三级缓存 + hotkey 探测 + Single-Flight

- **三级缓存**：Caffeine（本地 L1）→ Redis（L2）→ MySQL（L3），读请求命中率 > 99%
- **Hotkey 探测**：滑动窗口统计访问频次，自动识别热 key 并延长 TTL
- **Single-Flight**：缓存击穿场景下，同一 key 的并发请求只穿透一次数据库

### 🔍 搜索系统 — ES 全文检索 + search_after + Canal 增量同步

- **search_after 深翻页**：替代 from/to，彻底规避深翻页性能陷阱
- **Completion Suggester**：输入框实时补全，毫秒级响应
- **Canal Outbox 驱动**：MySQL 写入触发 Canal 推送，ES 索引增量同步，数据最终一致

### 🤖 RAG 问答 — 全链路向量检索

- **Embedding 向量化**：使用阿里云 text-embedding-v4（1536 维）将知识库文档向量化
- **ES 向量存储**：Spring AI + Elasticsearch VectorStore，语义检索相关文档
- **DeepSeek 生成**：检索结果拼接为 Prompt，DeepSeek Chat 生成最终回答

---

## 🗂️ 目录结构

```
dengtai/
├── dengtai-backend/                  # Spring Boot 后端
│   ├── src/main/java/com/caiths/dengtai/
│   │   ├── auth/                     # 认证模块（JWT + 验证码）
│   │   ├── knowpost/                 # 灯文内容模块
│   │   ├── counter/                  # 点赞收藏计数模块
│   │   ├── relation/                 # 社交关系模块（Canal Outbox）
│   │   ├── search/                   # 搜索模块（ES）
│   │   ├── llm/                      # AI 模块（RAG + DeepSeek）
│   │   ├── storage/                  # 对象存储模块（七牛云 Kodo）
│   │   ├── cache/                    # 缓存模块（三级 + hotkey）
│   │   ├── user/                     # 用户模块
│   │   ├── profile/                  # 个人资料模块
│   │   └── common/                   # 公共组件（异常体系、工具）
│   └── src/main/resources/
│       ├── application.yml           # 主配置
│       └── mapper/                   # MyBatis XML
└── dengtai-frontend/                 # React + Vite 前端
    ├── src/
    │   ├── pages/                    # 页面组件
    │   ├── components/               # 通用组件
    │   └── api/                      # 接口层
    └── package.json
```

---

## 🛠️ 技术栈

| 层次 | 技术选型 |
|------|---------|
| 前端框架 | React 18 + Vite 5 |
| 后端框架 | Spring Boot 3.4 / Java 21 |
| 持久层 | MySQL 8 + MyBatis |
| 缓存 | Redis 8（Bitmap、SDS、Caffeine L1）|
| 消息队列 | Apache Kafka 4.0 |
| CDC | Alibaba Canal 1.1.8 |
| 搜索 / 向量 | Elasticsearch 9.3 |
| AI | Spring AI 1.0 + DeepSeek + 阿里云 Embedding |
| 对象存储 | 七牛云 Kodo（新加坡区域）|
| 分布式锁 | Redisson |
| 认证 | JWT RS256（Spring Security OAuth2 Resource Server）|

---

## ⚡ 快速启动

### 前置依赖

```bash
# 确保以下服务已运行
MySQL 8      → localhost:3306
Redis 8      → localhost:6379
Kafka 4.0    → localhost:9092
Elasticsearch 9 → localhost:9200
Canal        → localhost:11111
```

### 后端

```bash
cd dengtai-backend

# 填写 application.yml 中的 AI Key 等配置项，然后运行
./mvnw spring-boot:run -Dmaven.repo.local=~/.m2/repository
```

### 前端

```bash
cd dengtai-frontend
npm install
npm run dev
```

---

## 📄 License

[MIT](LICENSE) © 2025 [caiths](https://github.com/poboll)
