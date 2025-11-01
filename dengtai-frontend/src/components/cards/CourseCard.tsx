import type { ReactNode } from "react";
import clsx from "clsx";
import { Link } from "react-router-dom";
import Tag from "@/components/common/Tag";
import { HeartIcon } from "@/components/icons/Icon";
import styles from "./CourseCard.module.css";

export type CourseCardProps = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  isFree?: boolean;
  teacher: {
    name: string;
    avatarText: string;
  };
  stats?: {
    likes: number;
    views: number;
  };
  coverImage?: string;
  layout?: "vertical" | "horizontal";
  showPlayBadge?: boolean;
  footerExtra?: ReactNode;
  to?: string;
  className?: string;
};

const CourseCard = ({
  title,
  summary,
  tags,
  isFree = true,
  teacher,
  stats,
  coverImage,
  layout = "vertical",
  showPlayBadge,
  footerExtra,
  to,
  className
}: CourseCardProps) => {
  const content = (
    <>
      {isFree ? (
        <div className={styles.badge}>
          <span>免费</span>
        </div>
      ) : null}
      {showPlayBadge ? (
        <div className={styles.playBadge}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M5.4 3.8a1 1 0 0 0-1.6.8v6.8a1 1 0 0 0 1.6.8l5.6-3.4a1 1 0 0 0 0-1.6z" fill="currentColor" />
          </svg>
        </div>
      ) : null}

      <div className={`${styles.content} ${layout === "horizontal" ? styles.variantHorizontal : ""}`}>
        <div className={layout === "horizontal" ? styles.variantHorizontalText : undefined}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{summary}</p>
          <div className={styles.tagGroups}>
            {tags.map(tag => (
              <Tag key={tag}>#{tag}</Tag>
            ))}
          </div>
        </div>
        {coverImage ? (
          <img className={styles.cover} src={coverImage} alt={title} loading="lazy" />
        ) : null}
      </div>

      <div className={styles.meta}>
        <div className={styles.teacher}>
          <div className={styles.teacherAvatar}>{teacher.avatarText}</div>
          <div className={styles.teacherInfo}>
            <span className={styles.teacherName}>{teacher.name}</span>
            <span>授课导师</span>
          </div>
        </div>
        {footerExtra ?? (
          <div className={styles.stats}>
            {stats ? (
              <>
                <span className={styles.statItem}>
                  <HeartIcon width={16} height={16} strokeWidth={1.6} />
                  {stats.likes}
                </span>
                <span className={styles.statItem}>👁️ {stats.views}</span>
              </>
            ) : null}
          </div>
        )}
      </div>
    </>
  );

  return (
    <article className={clsx(styles.card, className)}>
      {to ? <Link to={to}>{content}</Link> : content}
    </article>
  );
};

export default CourseCard;
