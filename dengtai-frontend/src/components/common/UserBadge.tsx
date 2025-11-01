import styles from "./UserBadge.module.css";

type UserBadgeProps = {
  name: string;
  alias?: string;
};

const getInitial = (value: string) => value.trim().charAt(0).toUpperCase() || "?";

const UserBadge = ({ name, alias }: UserBadgeProps) => {
  return (
    <div className={styles.badge}>
      <div className={styles.avatar}>{getInitial(name)}</div>
      <div className={styles.meta}>
        <span className={styles.name}>{name}</span>
        {alias ? <span className={styles.alias}>{alias}</span> : null}
      </div>
    </div>
  );
};

export default UserBadge;
