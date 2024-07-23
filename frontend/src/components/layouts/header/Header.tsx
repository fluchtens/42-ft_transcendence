import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useFriendshipSocket } from "@/hooks/useFriendshipSocket";
import { userLogoutApi } from "@/services/auth.api";
import { GiPingPongBat } from "react-icons/gi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LinksMenu } from "./LinksMenu";

const NavLink = ({ label, link, pathname }: { label: string; link: string; pathname: string }) => (
  <Link
    to={link}
    className={`px-1.5 py-1 text-base font-light transition-colors  ${
      pathname === link ? "text-foregound" : "text-foreground/60 hover:text-foreground/80"
    }`}
  >
    {label}
  </Link>
);

export default function Header() {
  const { user, refreshUser } = useAuth();
  const firendshipSocket = useFriendshipSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const handleLogout = async () => {
    await userLogoutApi();
    await refreshUser();
    firendshipSocket.disconnect();
    window.location.reload();
    navigate("/");
  };

  return (
    <header className="px-4 py-3 border-b">
      <nav className="flex justify-between items-center">
        <LinksMenu />
        <div className="hidden lg:flex items-center gap-2">
          <Link to="/" className="hidden py-2 lg:flex items-center gap-2 text-lg font-semibold">
            <GiPingPongBat className="w-[2rem] h-[2rem]" />
            ft_transcendence
          </Link>
          <div className="flex items-center">
            <NavLink label="Game" link="/game" pathname={pathname} />
            <NavLink label="Channels" link="/channels" pathname={pathname} />
            <NavLink label="Friends" link="/friends" pathname={pathname} />
            <NavLink label="Leaderboard" link="/leaderboard" pathname={pathname} />
          </div>
        </div>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="ml-1.5 w-10 h-10 rounded-full">
                <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                <AvatarImage src={user.avatar} className="object-cover pointer-events-none" />
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link to={`/user/${user.username}`}>Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>Sign out </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        )}
      </nav>
    </header>
  );
}
