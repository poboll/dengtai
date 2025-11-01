import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import { learningEmptyState } from "@/data/content";
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./LearningPage.module.css";

const LearningPage = () => {
  return (
    <AppLayout
      header={
        <MainHeader
          headline="我的学习"
          subtitle="记录每一次学习进步，保持持续成长"
          rightSlot={<AuthStatus />}
        />
      }
    >
      <div className={styles.emptyCard}>
        <div className={styles.icon}>📚</div>
        <div className={styles.title}>{learningEmptyState.title}</div>
        <div className={styles.description}>{learningEmptyState.description}</div>
        <button type="button" className="ghost-button">
          {learningEmptyState.actionLabel}
        </button>
      </div>
    </AppLayout>
  );
};

export default LearningPage;
