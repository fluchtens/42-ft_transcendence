import { useLocation, Link } from 'react-router-dom'

interface PageButtonProps {
  path: string;
  text: string;
  icon: React.ReactNode;
}

function PageButton({ path, text, icon }: PageButtonProps) {
  const { pathname } = useLocation();

  return (
    <li className={`hover:text-tertiary ${pathname === path ? "text-tertiary" : ""}`}>
      <Link to={path} className="flex items-center">
        {icon}
        {text}
      </Link>
    </li>
  );
}

export default PageButton;
