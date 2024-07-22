import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { disableTwoFaApi, generateTwoFaQrCodeApi } from "../../services/auth.api";
import { updatePasswordApi } from "../../services/user.api";
import { notifyError, notifySuccess } from "../../utils/notifications";
import TwoFaSetup from "./TwoFaSetup";

interface InputTextProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TextInput = ({ label, value, onChange }: InputTextProps) => (
  <div>
    <label className="text-sm font-medium">{label}</label>
    <Input type="password" value={value} onChange={onChange} placeholder="" required className="mt-1 max-w-[20rem] w-full"></Input>
  </div>
);

function AuthSettings() {
  const { user, refreshUser } = useAuth();
  const [actualPwd, setActualPwd] = useState<string>("");
  const [newPwd, setNewPwd] = useState<string>("");
  const [confirmNewPwd, setConfirmNewPwd] = useState<string>("");
  const [qrcode, setQrcode] = useState<string>("");
  const [twoFaModal, setTwoFaModal] = useState<boolean>(false);

  const closeTwoFaModal = () => {
    setTwoFaModal(false);
  };

  const changeActualPwd = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActualPwd(e.target.value);
  };

  const changeNewPwd = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPwd(e.target.value);
  };

  const changeConfirmNewPwd = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmNewPwd(e.target.value);
  };

  const submitData = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPwd === confirmNewPwd) {
      const { success, message } = await updatePasswordApi(actualPwd, newPwd);
      success ? notifySuccess(message) : notifyError(message);
    } else {
      notifyError("Password confirmation doesn't match the password");
    }

    setActualPwd("");
    setNewPwd("");
    setConfirmNewPwd("");
    await refreshUser();
  };

  const enableTwoFa = async () => {
    const data = await generateTwoFaQrCodeApi();
    if (!data.success) {
      notifyError(data.message);
      return;
    }

    if (data.qrcode) {
      const qrCodeBase64 = btoa(data.qrcode);
      setQrcode(qrCodeBase64);
      setTwoFaModal(true);
    }
  };

  const disableTwoFa = async () => {
    const data = await disableTwoFaApi();
    if (!data.success) {
      notifyError(data.message);
      return;
    }

    await refreshUser();
    notifySuccess(data.message);
  };

  useEffect(() => {
    if (!user) return;
  }, [user]);

  return (
    <>
      {user && (
        <div className="mt-5">
          <form className="p-0" onSubmit={submitData}>
            <h1 className="text-xl md:text-2xl font-semibold">Change password</h1>
            <Separator className="mt-3" />
            <div className="mt-4 flex flex-col gap-2">
              <TextInput label="Old password" value={actualPwd} onChange={changeActualPwd} />
              <TextInput label="New password" value={newPwd} onChange={changeNewPwd} />
              <TextInput label="Confirm new password" value={confirmNewPwd} onChange={changeConfirmNewPwd} />
            </div>
            <Button type="submit" className="mt-6">
              Update password
            </Button>
          </form>
          <div className="mt-8">
            <h1 className="text-xl md:text-2xl font-semibold">Two-factor authentication</h1>
            <Separator className="mt-3" />
            {user.twoFa ? (
              <div className="mt-4">
                <h2 className="text-lg font-semibold">Two-factor authentication is enabled.</h2>
                <p>
                  Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to sign in.
                </p>
                <Button onClick={disableTwoFa} variant="destructive" className="mt-4">
                  Disable two-factor authentication
                </Button>
              </div>
            ) : (
              <div className="mt-4">
                <h2 className="text-lg font-semibold">Two-factor authentication is not enabled yet.</h2>
                <p className="text-sm font-normal text-muted-foreground">
                  Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to sign in.
                </p>
                <Button onClick={enableTwoFa} className="mt-4">
                  Enable two-factor authentication
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      {twoFaModal && qrcode && <TwoFaSetup qrcode={qrcode} close={closeTwoFaModal} />}
    </>
  );
}

export default AuthSettings;
