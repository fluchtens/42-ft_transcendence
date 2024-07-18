import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="flex flex-col items-center">
      <div className="mt-14 text-center">
        <h1 className="text-3xl md:text-5xl font-semibold">ft_transcendence</h1>
        <h2 className="mt-1 text-base md:text-xl font-extralight">Modern multiplayer pong game</h2>
      </div>
      <Button className="mt-5" asChild>
        <Link to="/game">Play Now</Link>
      </Button>
    </div>
  );
}

export default Home;
