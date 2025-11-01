import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import SectionHeader from "@/components/common/SectionHeader";
import CourseCard from "@/components/cards/CourseCard";
import Tag from "@/components/common/Tag";
import { ArrowRightIcon } from "@/components/icons/Icon";
import { categories, mockContents, tabFilters } from "@/data/content";
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./HomePage.module.css";

const HomePage = () => {
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [activeFilter, setActiveFilter] = useState(tabFilters[0].id);

  const filteredContents = useMemo(() => {
    const base = activeCategory === "全部" ? mockContents : mockContents.filter(item => item.category === activeCategory);
    if (activeFilter === "popular") {
      return [...base].sort((a, b) => b.views - a.views);
    }
    return [...base].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeCategory, activeFilter]);

  const featured = filteredContents[0];
  const rest = filteredContents.slice(1);

  return (
    <AppLayout
      header={
        <MainHeader
          headline="灯塔 · 让知识发光"
          subtitle="精选实用好课，陪你成为更好的自己"
          tabs={categories.map(cat => ({
            id: cat,
            label: cat,
            active: activeCategory === cat,
            onSelect: setActiveCategory
          }))}
          filters={tabFilters.map(filter => ({
            ...filter,
            active: activeFilter === filter.id,
            onSelect: setActiveFilter
          }))}
          rightSlot={<AuthStatus />}
        />
      }
    >
      <SectionHeader
        title="为你推荐的精选内容"
        subtitle="根据你的兴趣与学习进度，为你准备了这些灵感"
        actions={
          <button type="button" className="ghost-button">
            查看全部
          </button>
        }
      />

      {featured ? (
        <div className={styles.heroRow}>
          <CourseCard
            key={featured.id}
            id={featured.id}
            title={featured.title}
            summary={featured.summary}
            tags={featured.tags}
            isFree={featured.isFree}
            teacher={{ name: featured.mentor.name, avatarText: featured.mentor.name.charAt(0) }}
            stats={{ likes: featured.likes, views: featured.views }}
            coverImage={featured.coverImage}
            layout={featured.coverImage ? "horizontal" : "vertical"}
            footerExtra={
              <Tag tone="neutral">
                <ArrowRightIcon width={16} height={16} strokeWidth={1.8} /> 立即学习
              </Tag>
            }
            to={`/course/${featured.id}`}
            className={styles.heroCard}
          />
        </div>
      ) : null}

      <div className={styles.masonry}>
        {rest.map(item => (
          <div key={item.id} className={styles.masonryItem}>
            <CourseCard
              id={item.id}
              title={item.title}
              summary={item.summary}
              tags={item.tags}
              isFree={item.isFree}
              teacher={{ name: item.mentor.name, avatarText: item.mentor.name.charAt(0) }}
              stats={{ likes: item.likes, views: item.views }}
              coverImage={item.coverImage}
              layout={item.coverImage ? "horizontal" : "vertical"}
              showPlayBadge={item.kind === "video"}
              to={`/course/${item.id}`}
            />
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default HomePage;
