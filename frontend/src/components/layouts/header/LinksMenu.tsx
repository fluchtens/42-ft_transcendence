import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Link, useLocation } from "react-router-dom";

const NavLink = ({ label, link, pathname }: { label: string; link: string; pathname: string }) => (
  <SheetClose asChild>
    <Link
      to={link}
      className={`py-1 text-base font-light transition-colors ${
        pathname === link ? "text-foregound" : "text-foreground/60 hover:text-foreground/80"
      }`}
    >
      {label}
    </Link>
  </SheetClose>
);

export const LinksMenu = () => {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <Sheet>
      <SheetTrigger asChild className="flex md:hidden">
        <Button variant="outline" size="icon">
          <HamburgerMenuIcon className="h-[1.1rem] w-[1.1rem]" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetClose asChild>
          <Link to="/" className="text-xl font-semibold text-left">
            <DialogTitle>ft_transcendence</DialogTitle>
            <DialogDescription className="text-sm font-light text-muted-foreground">Multiplayer pong game</DialogDescription>
          </Link>
        </SheetClose>
        <div className="mt-1 flex-col flex">
          <NavLink label="Game" link="/game" pathname={pathname} />
          <NavLink label="Leaderboard" link="/leaderboard" pathname={pathname} />
        </div>
      </SheetContent>
    </Sheet>
  );
};
