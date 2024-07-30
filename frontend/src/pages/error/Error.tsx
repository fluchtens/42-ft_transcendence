import { Link } from "react-router-dom";
import errorLogo from "/cry.png";

export default function Error() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <div className="p-4 max-w-[40rem] flex flex-col items-center gap-0.5 text-center">
        <h1 className="flex justify-center items-center">
          <span className="text-9xl font-bold">4</span>
          <img src={errorLogo} className="max-w-[7rem] max-h-[7rem]" />
          <span className="text-9xl font-bold">4</span>
        </h1>
        <h2 className="text-base font-semibold">Oops! Page Not Be Found</h2>
        <p className="text-sm font-normal text-muted-foreground">
          Sorry but the page you are looking for does not exist, has been removed. name changed or is temporarily unavailable
        </p>
        <Link to="/" className="text-base font-semibold">
          Back to home
        </Link>
      </div>
    </div>
  );
}
