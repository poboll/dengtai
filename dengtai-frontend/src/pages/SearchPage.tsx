import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import SectionHeader from "@/components/common/SectionHeader";
import SearchBar from "@/components/common/SearchBar";
import Tag from "@/components/common/Tag";
import { suggestions } from "@/data/content";
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./SearchPage.module.css";

const SearchPage = () => {
  const [searchValue, setSearchValue] = useState("");
  const history = ["AI", "Python编程"];

  return (
    <AppLayout
      header={
        <MainHeader
          headline="搜索你想学习的知识"
          subtitle="从提示词或你的历史记录开始探索，连接灵感与成长"
          rightSlot={<AuthStatus />}
        >
          <SearchBar
            placeholder="搜索你想学习的知识..."
            value={searchValue}
            onChange={setSearchValue}
            onSubmit={() => undefined}
          />
        </MainHeader>
      }
    >
      <div className={styles.searchArea}>
        <SectionHeader title="搜索历史" subtitle="快速回到你关注的主题" />
        <div className={styles.history}>
          {history.map(item => (
            <div key={item} className={styles.historyItem}>
              {item}
            </div>
          ))}
        </div>

        <SectionHeader title="猜你想搜" subtitle="我们为你准备了一些灵感方向" />
        <div className={styles.suggestions}>
          {suggestions.map(item => (
            <div key={item.id} className={styles.suggestionCard}>
              <Tag tone="neutral">灵感</Tag> {item.label}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default SearchPage;
