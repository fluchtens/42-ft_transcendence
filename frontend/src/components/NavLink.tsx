import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./NavLink.module.scss";

interface NavLinkProps {
  path: string;
  text: string;
  icon: ReactNode;
}

const NavLink = ({ path, text, icon }: NavLinkProps) => {
  const { pathname } = useLocation();
  const isAcualPath = pathname === path;

  return (
    <Link
      to={path}
      className={isAcualPath ? styles.actualPathLink : styles.link}
    >
      <span className={styles.icon}>{icon}</span>
      {text}
    </Link>
  );
};

export { NavLink };
