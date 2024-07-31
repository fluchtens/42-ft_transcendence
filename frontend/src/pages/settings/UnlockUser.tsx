import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { unlockUserApi } from "../../services/friendship.api";
import { getUserByUsernameApi } from "../../services/user.api";
import { notifyError, notifySuccess } from "../../utils/notifications";

function UnlockUser() {
  const [target, setTarget] = useState<string>("");
  const { user } = useAuth();

  const changeTarget = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTarget(e.target.value);
  };

  const submitData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;

    const userData = await getUserByUsernameApi(target);
    if (!userData) {
      notifyError("User not found");
      setTarget("");
      return;
    }

    const { success, message } = await unlockUserApi(userData.id);
    success ? notifySuccess(message) : notifyError(message);
    setTarget("");
  };

  return (
    <>
      {user && (
        <form className="mt-8" onSubmit={submitData}>
          <h1 className="text-xl md:text-2xl font-semibold">Blocked users</h1>
          <Separator className="mt-3" />
          <div className="mt-4 flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Unlock a user.</h2>
            <p className="text-sm font-normal text-muted-foreground">By unblocking a user, you'll be able to communicate with them again.</p>
            <Input type="text" value={target} onChange={changeTarget} placeholder="Username" className="mt-1 max-w-[20rem] w-full"></Input>
          </div>
        </form>
      )}
    </>
  );
}

export default UnlockUser;
