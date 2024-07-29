import { GiPingPongBat } from "react-icons/gi";
import { Link } from "react-router-dom";

export const MainTitle = () => (
  <Link to="/" className="p-2 flex justify-center items-center gap-3 text-2xl font-semibold">
    <GiPingPongBat className="w-[2rem] h-[2rem]" />
    ft_transcendence
  </Link>
);
