import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainTitle } from "../../../components/MainTitle";
import { useAuth } from "../../../hooks/useAuth";
import { userLoginApi } from "../../../services/auth.api";
import { notifySuccess } from "../../../utils/notifications";

export default function Login() {
  const { user, refreshUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const changeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const changePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const submitData = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = { username, password };
    const data = await userLoginApi(user);
    if (!data.success) {
      setErrorMessage(data.message);
      return;
    }

    if (data.twoFa) {
      navigate("/login/twofa");
    } else {
      navigate("/");
      notifySuccess(data.message);
      window.location.reload();
    }

    await refreshUser();
  };

  const fortyTwoAuth = async () => {
    try {
      window.location.href = `${import.meta.env.VITE_BACK_URL}/auth/42`;
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      {user === null && (
        <div className="max-w-[25rem] p-2 md:p-0 w-full">
          <MainTitle />
          <form className="mt-2 px-3 sm:px-8 py-3 sm:py-7 flex flex-col items-center rounded-xl bg-card text-center" onSubmit={submitData}>
            <h1 className="text-lg sm:text-2xl font-semibold">Sign in to your account</h1>
            {errorMessage && (
              <div className="mt-4 w-full px-3 py-2 bg-[#f8d7da] rounded-md">
                <p className="text-sm text-[#721c24] text-center">{Array.isArray(errorMessage) ? errorMessage[0] : errorMessage}</p>
              </div>
            )}
            <div className="mt-4 w-full flex flex-col gap-1.5">
              <div className="flex flex-col items-start">
                <label className="text-sm font-medium">Username</label>
                <Input type="text" value={username} onChange={changeUsername} placeholder="Enter a username" className="bg-secondary" required />
              </div>
              <div className="flex flex-col items-start">
                <label className="text-sm font-medium">Password</label>
                <Input type="password" value={password} onChange={changePassword} placeholder="Enter a password" className="bg-secondary" required />
              </div>
            </div>
            <div className="mt-6 w-full flex flex-col gap-1.5">
              <Button type="submit">Sign in</Button>
              <Button type="button" onClick={fortyTwoAuth} className="bg-[#36babb] hover:bg-[#48c7c7] text-white">
                Sign in with 42
              </Button>
            </div>
            <p className="mt-4">
              <span className="text-sm font-light text-muted-foreground">Don't have an account yet?</span>
              <Link to="/register" className="ml-1 text-sm font-medium text-muted-foreground">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      )}
    </>
  );
}
