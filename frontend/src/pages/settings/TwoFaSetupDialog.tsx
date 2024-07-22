import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { enableTwoFaApi, generateTwoFaQrCodeApi } from "@/services/auth.api";
import { notifyError, notifySuccess } from "@/utils/notifications";
import { useEffect, useState } from "react";

export const TwoFaSetupDialog = () => {
  const { user, refreshUser } = useAuth();
  const [open, setOpen] = useState<boolean>(false);
  const [qrCode, setQrCode] = useState<string | null>("");
  const [token, setToken] = useState<string>("");

  const generateQRCode = async () => {
    const data = await generateTwoFaQrCodeApi();
    if (!data.success) {
      setQrCode(null);
      notifyError(data.message);
      return;
    }

    if (data.qrcode) {
      const qrCodeBase64 = btoa(data.qrcode);
      setQrCode(atob(qrCodeBase64));
    }
  };

  const changeToken = (newValue: string) => {
    setToken(newValue);
  };

  const enableTwoFa = async (e: React.FormEvent) => {
    e.preventDefault();

    const { success, message } = await enableTwoFaApi(token);
    if (!success) {
      notifyError(message);
      return;
    }

    await refreshUser();
    notifySuccess(message);
    setOpen(false);
  };

  useEffect(() => {
    if (!user) {
      return;
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={generateQRCode} className="mt-4">
          Enable two-factor authentication
        </Button>
      </DialogTrigger>
      {qrCode && (
        <DialogContent className="max-w-[40rem] w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Enable two-factor authentication (2FA)</DialogTitle>
            <DialogDescription className="text-sm font-normal">Add security to your account.</DialogDescription>
          </DialogHeader>
          <Separator />
          <form className="p-0 flex flex-col gap-5 text-center md:text-left" onSubmit={enableTwoFa}>
            <div>
              <label className="text-base font-semibold">Setup authenticator app</label>
              <p className="text-sm font-normal text-muted-foreground">
                Authenticator apps like Google Authenticator generate one-time passwords that are used as a second factor to verify your identity when
                prompted during sign-in.
              </p>
            </div>
            <div>
              <label className="text-base font-semibold">Scan the QR code</label>
              <p className="text-sm font-normal text-muted-foreground">Use an authenticator app to scan.</p>
              {qrCode && <img src={qrCode} alt="qrcode" className="mt-2" />}
            </div>
            <div>
              <label className="text-base font-semibold">Verify the code from the app</label>
              {/* <input type="text" value={token} onChange={changeToken} placeholder="XXXXXX" required /> */}
              <InputOTP maxLength={6} value={token} onChange={changeToken} required>
                <InputOTPGroup className="mt-2">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup className="mt-2">
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Close
                </Button>
              </DialogClose>
              <Button type="submit">Continue</Button>
            </div>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
};
