import { NavLink, Link } from "react-router-dom";
import { AiIcon, CreateIcon, HomeIcon, LighthouseIcon, ProfileIcon, SearchIcon, StudyIcon } from "@/components/icons/Icon";
import styles from "./Sidebar.module.css";

const navItems = [
  { to: "/", label: "首页", Icon: HomeIcon },
  { to: "/search", label: "搜索", Icon: SearchIcon },
  { to: "/create", label: "创作", Icon: CreateIcon },
  { to: "/learn", label: "学习", Icon: StudyIcon },
  { to: "/ai", label: "AI助手", Icon: AiIcon },
  { to: "/profile", label: "我的", Icon: ProfileIcon },
] as const;

const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <Link to="/about" className={styles.logoLink}>
        <LighthouseIcon width={28} height={28} stroke="none" fill="#fff" />
      </Link>
      <nav className={styles.nav}>
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.linkActive}` : styles.link
            }
          >
            <Icon />
            <span className={styles.label}>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className={styles.spacer} />
      <div className={styles.footer}>
        <Link to="/about" className={styles.footerLink}>
          <span className={styles.footerBrand}>灯塔</span>
          <div className={styles.footerSlogan}>让知识发光</div>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
