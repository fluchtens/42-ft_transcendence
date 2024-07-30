import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useChatSocket } from "../../hooks/useChatSocket";
import { updateAvatarApi, updateUsernameApi } from "../../services/user.api";
import { notifyError, notifySuccess } from "../../utils/notifications";

function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  const [username, setUsername] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const chatSocket = useChatSocket();

  const changeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const avatarSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files && e.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          if (user) {
            user.avatar = reader.result as string;
          }
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const submitData = async (e: React.FormEvent) => {
    e.preventDefault();

    if (username && user?.username !== username) {
      const { success, message } = await updateUsernameApi(username);
      const formatMessage = Array.isArray(message) ? message[0] : message;
      success ? notifySuccess(message) : notifyError(formatMessage);
    }

    if (file) {
      const { success, message } = await updateAvatarApi(file);
      success ? notifySuccess(message) : notifyError(message);
    }

    setFile(null);
    await refreshUser();
    chatSocket.emit("refreshUser");
  };

  useEffect(() => {
    if (user) {
      setUsername(user.username);
    }
  }, [user]);

  return (
    <>
      {user && (
        <form className="mt-5 p-0">
          <h1 className="text-xl md:text-2xl font-semibold">Public profile</h1>
          <Separator className="mt-3" />
          <div className="mt-4 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Username</label>
              <Input type="text" value={username} onChange={changeUsername} placeholder="Enter a username" required></Input>
              <p className="text-xs font-normal text-muted-foreground">Your username is your unique identifier on our platform.</p>
            </div>
            <div className="relative flex flex-col items-start md:items-center gap-2">
              <label className="text-sm font-medium">Profile picture</label>
              {file ? (
                <img src={URL.createObjectURL(file)} />
              ) : (
                <Avatar className="w-[12rem] h-[12rem] rounded-full">
                  <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                  {user.avatar && <AvatarImage src={user.avatar} className="object-cover pointer-events-none" />}
                </Avatar>
              )}
              <label className="px-4 py-2 absolute bottom-0 left-0 bg-secondary rounded-lg text-sm font-medium cursor-pointer">
                <input type="file" accept=".png, .jpg, .jpeg, .gif" onChange={avatarSelection} className="hidden" />
                Edit
              </label>
            </div>
          </div>
          <Button onClick={submitData} className="mt-6">
            Update profile
          </Button>
        </form>
      )}
    </>
  );
}

export default ProfileSettings;
