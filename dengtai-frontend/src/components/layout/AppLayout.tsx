import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import styles from "./AppLayout.module.css";

type AppLayoutProps = {
  header?: ReactNode;
  children: ReactNode;
  variant?: "default" | "cardless" | "full";
};

const AppLayout = ({ header, children, variant = "default" }: AppLayoutProps) => {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className={`app-content ${styles.container}`}>
        {header}
        <div className={
          variant === "full" ? styles.full :
          variant === "cardless" ? styles.main :
          styles.pageCard
        }>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
