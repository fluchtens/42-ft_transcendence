import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { userRegistrationApi } from "../../services/auth.api";
import { notifySuccess } from "../../utils/notifications";
import { MainTitle } from "./MainTitle";

function Register() {
  const { user } = useAuth();
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
    const data = await userRegistrationApi(user);
    if (!data.success) {
      setErrorMessage(data.message);
      return;
    }

    navigate("/login");
    notifySuccess(data.message);
  };

  return (
    <>
      {user === null && (
        <div className="max-w-[22rem] p-2 md:p-0 w-full">
          <MainTitle />
          <form className="mt-2 px-3 sm:px-6 py-3 sm:py-5 flex flex-col items-center rounded-xl bg-card" onSubmit={submitData}>
            <h1 className="text-2xl font-semibold">Register a new account</h1>
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
              <Button type="submit">Sign up</Button>
            </div>
            <p className="mt-4">
              <span className="text-sm font-light text-muted-foreground">Have an account?</span>
              <Link to="/login" className="ml-1 text-sm font-medium text-muted-foreground">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      )}
    </>
  );
}

export default Register;
