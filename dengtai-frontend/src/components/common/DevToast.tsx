import { useEffect, useState } from "react";
import styles from "./DevToast.module.css";

type DevToastProps = {
  message: string;
  visible: boolean;
  duration?: number;
  onDismiss: () => void;
};

const DevToast = ({ message, visible, duration = 4000, onDismiss }: DevToastProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShow(false);
      return;
    }
    requestAnimationFrame(() => setShow(true));
    const timer = window.setTimeout(() => {
      setShow(false);
      window.setTimeout(onDismiss, 320);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  return (
    <div className={`${styles.toast} ${show ? styles.enter : styles.exit}`}>
      <span className={styles.emoji}>🎉</span>
      <span className={styles.text}>{message}</span>
    </div>
  );
};

export default DevToast;
