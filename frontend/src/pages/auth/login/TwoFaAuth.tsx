import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainTitle } from "../../../components/MainTitle";
import { useAuth } from "../../../hooks/useAuth";
import { authUserTwoFaApi } from "../../../services/auth.api";

export default function TwoFaAuth() {
  const { user } = useAuth();
  const [token, setToken] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const changeToken = (newValue: string) => {
    setToken(newValue);
  };

  const submitData = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = await authUserTwoFaApi(token);
    if (!data.success) {
      setErrorMessage(data.message);
      return;
    }

    navigate("/");
    window.location.reload();
  };

  return (
    <>
      {user === null && (
        <div className="max-w-[25rem] p-2 md:p-0 w-full">
          <MainTitle />
          <form className="mt-2 px-3 sm:px-8 py-3 sm:py-7 flex flex-col items-center rounded-xl bg-card text-center" onSubmit={submitData}>
            <h1 className="text-lg sm:text-2xl font-semibold">Two-factor authentication</h1>
            <p className="text-sm text-muted-foreground">Open your two-factor authenticator app to view your authentication code.</p>
            {errorMessage && (
              <div className="mt-4 w-full px-3 py-2 bg-[#f8d7da] rounded-md">
                <p className="text-sm text-[#721c24] text-center">{Array.isArray(errorMessage) ? errorMessage[0] : errorMessage}</p>
              </div>
            )}
            <div className="mt-4 w-full flex flex-col gap-1.5">
              <div className="flex flex-col items-center">
                <label className="text-sm font-medium">Authentication code</label>
                <InputOTP maxLength={6} value={token} onChange={changeToken} required>
                  <InputOTPGroup className="mt-2">
                    <InputOTPSlot index={0} className="bg-secondary" />
                    <InputOTPSlot index={1} className="bg-secondary" />
                    <InputOTPSlot index={2} className="bg-secondary" />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup className="mt-2">
                    <InputOTPSlot index={3} className="bg-secondary" />
                    <InputOTPSlot index={4} className="bg-secondary" />
                    <InputOTPSlot index={5} className="bg-secondary" />
                  </InputOTPGroup>
                </InputOTP>
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
