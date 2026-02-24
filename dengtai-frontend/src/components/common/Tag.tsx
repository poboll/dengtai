import type { ReactNode } from "react";
import clsx from "clsx";
import styles from "./Tag.module.css";

type TagProps = {
  children: ReactNode;
  tone?: "primary" | "success" | "neutral";
  onClick?: () => void;
};

const Tag = ({ children, tone = "primary", onClick }: TagProps) => {
  const tagClass = clsx(styles.tag, {
    [styles.toneSuccess]: tone === "success",
    [styles.toneNeutral]: tone === "neutral",
    [styles.clickable]: !!onClick,
  });
  return (
    <span
      className={tagClass}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </span>
  );
};
export default Tag;
