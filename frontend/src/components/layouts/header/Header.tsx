import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useFriendshipSocket } from "@/hooks/useFriendshipSocket";
import { userLogoutApi } from "@/services/auth.api";
import { useEffect, useRef, useState } from "react";
import { AiFillHome, AiOutlineMenu } from "react-icons/ai";
import { BsFillChatDotsFill } from "react-icons/bs";
import { FaUserGroup } from "react-icons/fa6";
import { GiPingPongBat } from "react-icons/gi";
import { IoGameController } from "react-icons/io5";
import { MdLeaderboard } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { NavLink } from "./NavLink";

export default function Header() {
  const { user, refreshUser } = useAuth();
  const [navMenu, setNavMenu] = useState<boolean>(false);
  const navMenuRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(Boolean(user));
  const firendshipSocket = useFriendshipSocket();
  const navigate = useNavigate();

  const closeNavMenu = () => {
    setNavMenu(false);
  };

  const toggleNavMenu = () => {
    setNavMenu(!navMenu);
  };

  const handleLogout = async () => {
    await userLogoutApi();
    await refreshUser();
    setIsLoggedIn(false);
    firendshipSocket.disconnect();
    window.location.reload();
    navigate("/");
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navMenuRef.current) {
        if (!navMenuRef.current.contains(e.target as Node)) {
          setNavMenu(false);
        }
      }
    };
    document.addEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setIsLoggedIn(Boolean(user));
  }, [user]);

  return (
    <header className="px-4 py-3 border-b">
      <nav className="flex justify-between items-center">
        <div className="flex gap-4" ref={navMenuRef}>
          <Link to="/" className="hidden py-2 lg:flex items-center gap-2 text-lg font-semibold">
            <GiPingPongBat className="w-[2rem] h-[2rem]" />
            ft_transcendence
          </Link>
          <Button variant="ghost" size="icon" onClick={toggleNavMenu} className="flex lg:hidden">
            <AiOutlineMenu className="h-[1.2rem] w-[1.2rem]" />
          </Button>
          <ul className="flex items-center gap-4">
            <li>
              <NavLink path="/" text="HOME" icon={<AiFillHome />} cb={closeNavMenu} />
            </li>
            <li>
              <NavLink path="/game" text="GAME" icon={<IoGameController />} cb={closeNavMenu} />
            </li>
            <li>
              <NavLink path="/channels" text="CHANNELS" icon={<BsFillChatDotsFill />} cb={closeNavMenu} />
            </li>
            <li>
              <NavLink path="/friends" text="FRIENDS" icon={<FaUserGroup />} cb={closeNavMenu} />
            </li>
            <li>
              <NavLink path="/leaderboard" text="LEADERBOARD" icon={<MdLeaderboard />} cb={closeNavMenu} />
            </li>
          </ul>
        </div>
        {user && isLoggedIn ? (
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
