import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import CourseCard from "@/components/cards/CourseCard";
import { categories, mockContents } from "@/data/content";
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./HomePage.module.css";

const HomePage = () => {
  // 默认展示全部：不选中任何具体分类
  const [activeCategory, setActiveCategory] = useState<string>("");
  // 去除“最新/最热”筛选

  const filteredContents = useMemo(() => {
    // “推荐”视为展示全部内容；其他分类按匹配过滤，不做排序
    const base = !activeCategory ? mockContents : mockContents.filter(item => item.category === activeCategory);
    return base;
  }, [activeCategory]);

  // 仅保留瀑布流 Feed 展示全部内容

  return (
    <AppLayout
      header={
        <MainHeader
          headline="灯塔 · 让思想有温度，让知识会发光"
          tabs={categories.map(cat => ({
            id: cat,
            label: cat,
            // “推荐”激活态取决于 activeCategory 为空，其余按分类匹配
            active: cat === "推荐" ? activeCategory === "" : activeCategory === cat,
            onSelect: (id: string) => setActiveCategory(id === "推荐" ? "" : id)
          }))}
          rightSlot={<AuthStatus />}
        />
      }
    >
      <div className={styles.masonry}>
        {filteredContents.map(item => (
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
