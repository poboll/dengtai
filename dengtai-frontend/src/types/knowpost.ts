export type CreateDraftResponse = {
  id: string;
};

export type PresignRequest = {
  scene: "knowpost_content" | "knowpost_image";
  postId: string;
  contentType: string;
  ext: string; // with dot, e.g. ".md" 
};

export type PresignResponse = {
  objectKey: string;
  putUrl: string;
  headers: Record<string, string>;
  expiresIn: number;
};

export type ConfirmContentRequest = {
  objectKey: string;
  etag: string;
  size: number;
  sha256: string;
};

export type VisibleScope = "public" | "followers" | "school" | "private" | "unlisted";

export type UpdateKnowPostRequest = {
  title?: string;
  tagId?: number;
  tags?: string[];
  imgUrls?: string[];
  visible?: VisibleScope;
  isTop?: boolean;
  description?: string;
};

// Feed 列表数据结构
export type FeedItem = {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  tags: string[];
  authorAvatar?: string; // 后端字段名为 authorAvatar
  authorNickname: string;
};

export type FeedResponse = {
  items: FeedItem[];
  page: number;
  size: number;
  hasMore: boolean;
};

// 知文详情数据结构
export type KnowpostDetailResponse = {
  id: string;
  title: string;
  description: string;
  contentUrl: string;
  images: string[];
  tags: string[];
  authorAvatar?: string;
  authorNickname: string;
  authorTagJson?: string;
  likeCount: number;
  favoriteCount: number;
  isTop: boolean;
  visible: "public" | "followers" | "school" | "private" | "unlisted";
  type: "image_text" | string;
  publishTime?: string;
};