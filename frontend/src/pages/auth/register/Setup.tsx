import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainTitle } from "../../../components/MainTitle";
import { useAuth } from "../../../hooks/useAuth";
import { setupUserApi } from "../../../services/auth.api";

export default function Setup() {
  const { user } = useAuth();
  const { refreshUser } = useAuth();
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const changeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const submitData = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = await setupUserApi(username);
    if (!data.success) {
      setErrorMessage(data.message);
      return;
    }

    await refreshUser();
    navigate("/");
    window.location.reload();
  };

  return (
    <>
      {user === null && (
        <div className="max-w-[25rem] p-2 md:p-0 w-full">
          <MainTitle />
          <form className="mt-2 px-3 sm:px-8 py-3 sm:py-7 flex flex-col items-center rounded-xl bg-card text-center" onSubmit={submitData}>
            <h1 className="text-lg sm:text-2xl font-semibold">Set up your new account</h1>
            {errorMessage && (
              <div className="mt-4 w-full px-3 py-2 bg-[#f8d7da] rounded-md">
                <p className="text-sm text-[#721c24] text-center">{Array.isArray(errorMessage) ? errorMessage[0] : errorMessage}</p>
              </div>
            )}
            <div className="mt-4 w-full flex flex-col gap-1.5">
              <div className="flex flex-col items-start">
                <label className="text-sm font-medium">Username</label>
                <Input
                  type="text"
                  value={username}
                  onChange={changeUsername}
                  placeholder="Enter a unique username"
                  className="bg-secondary"
                  required
                />
              </div>
            </div>
            <div className="mt-6 w-full flex flex-col gap-1.5">
              <Button type="submit">Continue</Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
