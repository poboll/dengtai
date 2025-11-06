### 首页·知文（KnowPost）发布模块

说明：本模块支持图文帖的草稿创建、内容上传确认、元数据完善与发布。所有接口均需要携带 Access Token 鉴权。

---

- 路径：`POST /api/v1/knowposts/drafts`
  - 鉴权：需要携带 `Authorization: Bearer <access_token>`
  - 内容类型：`application/json`
  - 请求体：无
  - 成功响应：
    ```json
    { "id": 1234567890123 }
    ```
  - 可能错误：
    - `BAD_REQUEST`：请求不合法（例如服务内部参数错误）

---

- 路径：`POST /api/v1/knowposts/{id}/content/confirm`
  - 鉴权：需要携带 `Authorization: Bearer <access_token>`
  - 内容类型：`application/json`
  - 请求体（必填）：
    ```json
    {
      "objectKey": "posts/1234567890123/content.jpg",
      "etag": "\"F4BAAC...\"",
      "size": 2456789,
      "sha256": "b1946ac92492d2347c6235b4d2611184..."
    }
    ```
  - 成功响应：`204 No Content`
  - 生成规则：服务端会根据 `objectKey` 生成 `content_url`（优先使用 `oss.publicDomain`，否则使用 `https://{bucket}.{endpoint}/{objectKey}`），并写入 `content_etag`、`content_size`、`content_sha256`。
  - 可能错误：
    - `BAD_REQUEST`：草稿不存在或无权限（`id` 与当前用户不匹配）

---

- 路径：`PATCH /api/v1/knowposts/{id}`
  - 鉴权：需要携带 `Authorization: Bearer <access_token)`
  - 内容类型：`application/json`
  - 请求体（可选字段，未提交的字段保持不变）：
    ```json
    {
      "title": "我的图文帖标题",
      "tagId": 100,
      "tags": ["java", "编程"],
      "imgUrls": [
        "https://cdn.example.com/images/a.jpg",
        "https://cdn.example.com/images/b.jpg"
      ],
      "visible": "public|followers|school|private|unlisted",
      "isTop": false
    }
    ```
  - 成功响应：`204 No Content`
  - 说明：`tags` 与 `imgUrls` 存储为 JSON 数组字符串；仅更新提交的字段。
  - 可能错误：
    - `BAD_REQUEST`：草稿不存在或无权限（`id` 与当前用户不匹配）
    - `BAD_REQUEST`：JSON 处理失败（序列化异常）

---

- 路径：`POST /api/v1/knowposts/{id}/publish`
  - 鉴权：需要携带 `Authorization: Bearer <access_token>`
  - 内容类型：`application/json`
  - 请求体：无
  - 成功响应：`204 No Content`
  - 行为：设置状态为 `published`，并写入 `publish_time` 为当前时间。
  - 可能错误：
    - `BAD_REQUEST`：草稿不存在或无权限（`id` 与当前用户不匹配）

---

- 预签名直传接口
  - 路径：`POST /api/v1/storage/presign`
  - 鉴权：`Authorization: Bearer <access_token>`
  - 请求体示例：
    ```json
    {
      "scene": "knowpost_content", // 或 "knowpost_image"
      "postId": 1234567890123,
      "contentType": "text/markdown",
      "ext": ".md"
    }
    ```
  - 成功响应示例：
    ```json
    {
      "objectKey": "posts/1234567890123/content.md",
      "putUrl": "https://oss-example.aliyuncs.com/bucket/...",
      "headers": {
        "Content-Type": "text/markdown"
      },
      "expiresIn": 600
    }
    ```

---

#### 枚举与约束
- `type`：目前固定为 `image_text`（一期仅支持图文）。
- `visible`：`public`｜`followers`｜`private`｜`unlisted`。
- `status`：默认 `draft`，发布后为 `published`。
- `objectKey` 前缀建议：`posts/{postId}/...`，后端可按前缀做校验，避免越权引用对象。
- `etag` 说明：直传单对象时常等于 MD5；分片上传时不是 MD5，但仍可用于变化标识与并发控制。

#### 典型发布流程
1. 创建草稿：`POST /api/v1/knowposts/drafts` → 获取 `id`。
2. 前端直传正文到阿里云 OSS（预签名接口暂未在本文档内定义）。
3. 上传成功后回传确认：`POST /api/v1/knowposts/{id}/content/confirm`。
4. 完善元数据：`PATCH /api/v1/knowposts/{id}`（标题、标签、图片等）。
5. 发布：`POST /api/v1/knowposts/{id}/publish`。

---

#### 发布流程技术方案（前端参考）
- 鉴权与通用约定
  - 所有请求均需携带 `Authorization: Bearer <access_token>`，缺失或失效返回 `401`。
  - 所有写操作均以 `id + creator_id` 约束，避免越权；重复调用为幂等更新（发布重复调用无副作用）。

- 对象命名与内容格式建议
  - 正文（图文）：使用 `text/markdown` 或 `text/html` 存储。
    - `objectKey` 建议：`posts/{postId}/content.md` 或 `posts/{postId}/content.html`。
  - 图片：独立上传，统一放置到帖子目录下。
    - `objectKey` 建议：`posts/{postId}/images/{yyyyMMdd}/{index}-{hash}.jpg`。
  - 服务器会对 `objectKey` 前缀进行约束（如必须以 `posts/{postId}/` 开头），防止引用非本帖对象。

- 预签名直传接口
  - 路径：`POST /api/v1/storage/presign`
  - 鉴权：`Authorization: Bearer <access_token>`
  - 请求体示例：
    ```json
    {
      "scene": "knowpost_content", // 或 "knowpost_image"
      "postId": 1234567890123,
      "contentType": "text/markdown",
      "ext": ".md"
    }
    ```
  - 成功响应示例：
    ```json
    {
      "objectKey": "posts/1234567890123/content.md",
      "putUrl": "https://oss-example.aliyuncs.com/bucket/...",
      "headers": {
        "Content-Type": "text/markdown"
      },
      "expiresIn": 600
    }
    ```
  - 说明：
    - 客户端需按返回的 `headers` 执行 `PUT` 请求；`expiresIn` 为上传 URL 的有效期（建议 5–10 分钟）。
    - URL 仅用于上传；公开访问 URL 由服务端在确认时根据 `objectKey` 生成并写入 `content_url`。

- 上传与校验（前端执行）
  - 使用 `PUT {putUrl}` 直传，设置 `Content-Type` 为返回值；成功后在 HTTP 响应头中获取 `ETag`（通常含双引号，如 `"ABC..."`）。
  - 计算正文的 SHA-256（可选但推荐）：
    - Web Crypto API 示例：
      ```js
      const buf = await file.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buf);
      const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
      ```
  - 获取 `size`（字节）并在后续确认接口中一并提交。

- 上传成功后回传确认（服务端验收）
  - 路径：`POST /api/v1/knowposts/{id}/content/confirm`
  - 请求体：`objectKey`、`etag`、`size`、`sha256`
  - 行为：后端校验并写入 `content_object_key/content_etag/content_size/content_sha256`，生成 `content_url`。
  - 注意：分片上传的 `ETag` 与内容 MD5 不一致，若需强校验请同时提供 `sha256`。

- 元数据完善与发布
  - `PATCH /api/v1/knowposts/{id}`：提交 `title/tags/imgUrls/visible/isTop` 等；`tags/imgUrls` 以 JSON 数组字符串存储。
  - `POST /api/v1/knowposts/{id}/publish`：置 `status=published` 并写入 `publish_time`。
  - 调用大模型智能体生成文章摘要，写入 `description` 字段。请求格式如下，content填写description字段内容：
    ```javascript
    // Our official coze sdk for JavaScript [coze-js](https://github.com/coze-dev/coze-js)
    import { CozeAPI } from '@coze/api';

    const apiClient = new CozeAPI({
      token: 'pat_9jVo5ef2LD904wgq7SHyKuntYqdu3VxaDOfCuM3JC54tg5HK0wKm4TIPT57l4dai',
      baseURL: 'https://api.coze.cn'
    });
    const res = await apiClient.chat.stream({
      bot_id: '7569204736220495899',
      user_id: '12345',
      additional_messages: [
        {
          "role": "user",
          "type": "question",
          "content_type": "text",
          "content": ""
        }
      ],
    });
    ```

- 幂等与重试策略
  - 预签名获取：可重复请求，产生不同 `putUrl`；`objectKey` 建议稳定（由后端生成）。
  - 直传：网络失败可重试；如覆盖产生新 `ETag`，以最后一次成功的 `ETag` 为准。
  - 确认与元数据更新：幂等；重复提交会覆盖同字段。
  - 发布：重复调用无副作用（已发布不变）。

- 错误处理与可观测性建议
  - 上传失败：提示前端检查网络、URL是否过期（`expiresIn`）、`Content-Type` 是否一致。
  - 确认失败（`BAD_REQUEST`）：检查 `id` 与当前用户是否匹配、`objectKey` 前缀是否符合约束。
  - 建议在客户端记录 `postId/objectKey/etag/size/sha256` 以便问题追踪。

#### 首页 Feed 查询
- 路径：`GET /api/v1/knowposts/feed`
  - 鉴权：不需要（公开可见的已发布内容）
  - 查询参数：
    - `page`：页码，从 1 开始，默认 `1`
    - `size`：每页条数，默认 `20`，最大 `50`
  - 成功响应示例：
    ```json
    {
      "items": [
        {
          "id": "1234567890123",
          "title": "Python从入门到精通",
          "description": "掌握 Python 的核心能力…",
          "coverImage": "https://cdn.example.com/images/a.jpg",
          "tags": ["Python", "编程"],
          "authorAvatar": "https://cdn.example.com/avatars/u1.png",
          "authorNickname": "张老师"
        }
      ],
      "page": 1,
      "size": 20,
      "hasMore": true
    }
    ```
  - 说明：
    - 列表仅返回公开（`visible=public`）且已发布（`status=published`）的内容；置顶在前，其次按 `publish_time` 倒序。
    - `coverImage` 取自 `imgUrls` 的第一张图片；`tags` 为字符串数组。
    - 服务端采用 Redis 旁路缓存，键格式：`feed:public:{size}:{page}`；缓存 TTL 为 `60s + 随机抖动(0–30s)` 以降低缓存雪崩风险。
    - 为保证一致性，写操作（内容确认、元数据更新、发布）在数据库更新前后对 `feed:*` 做缓存双删：更新前删除一次、更新后延迟约 200ms 再删除一次，避免并发写回旧值。