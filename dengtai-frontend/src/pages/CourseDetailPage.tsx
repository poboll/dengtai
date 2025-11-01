import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import Tag from "@/components/common/Tag";
import SectionHeader from "@/components/common/SectionHeader";
import { mockContents } from "@/data/content";
import { ArrowRightIcon } from "@/components/icons/Icon";
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./CourseDetailPage.module.css";

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const course = useMemo(() => mockContents.find(item => item.id === id), [id]);

  if (!course) {
    return (
      <AppLayout>
        <div style={{ padding: "64px", textAlign: "center" }}>
          <h2>内容不存在</h2>
          <button type="button" className="ghost-button" onClick={() => navigate(-1)}>
            返回上一页
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      header={
        <MainHeader
          headline={course.title}
          subtitle={`${course.mentor.name} · ${new Date(course.createdAt).toLocaleDateString("zh-CN")}`}
          rightSlot={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button type="button" className="ghost-button" onClick={() => navigate(-1)}>
                返回
              </button>
              <AuthStatus />
            </div>
          }
        />
      }
      variant="cardless"
    >
      <article className={styles.detailCard}>
        {course.coverImage ? <img className={styles.heroImage} src={course.coverImage} alt={course.title} /> : null}
        <div className={styles.titleBlock}>
          <div className={styles.titleRow}>
            <span className={styles.title}>{course.title}</span>
            <Tag>#{course.category}</Tag>
            <Tag tone="success">免费</Tag>
          </div>
          <div className={styles.meta}>
            <span>{course.mentor.name}</span>
            <div className={styles.stats}>
              <span>👁️ {course.views}</span>
              <span>👍 {course.likes}</span>
            </div>
          </div>
          <div className={styles.tagList}>
            {course.tags.map(tag => (
              <Tag key={tag}>#{tag}</Tag>
            ))}
          </div>
        </div>

        <SectionHeader
          title="课程简介"
          subtitle="了解课程的学习目标与包含内容"
          actions={
            <button type="button" className="ghost-button">
              <ArrowRightIcon width={16} height={16} strokeWidth={1.6} /> 开始学习
            </button>
          }
        />

        <div className={styles.body}>{course.body ?? course.summary}</div>
      </article>
    </AppLayout>
  );
};

export default CourseDetailPage;
