import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useChatSocket } from "../../hooks/useChatSocket";
import { notifyError, notifySuccess } from "../../utils/notifications";

interface MessageElementProps {
  avatar: string;
  username: string;
  content: string;
  userId: number;
  gameInvit?: boolean;
}

const MessageElement = ({ avatar, username, content, userId, gameInvit }: MessageElementProps) => {
  const useChat = useChatSocket();

  const joiningGame = () => {
    if (gameInvit) {
      useChat.emit("joinGame", userId, (result: string) => {
        if (!result) {
          notifySuccess("You have successfully joined the game");
        } else if (result) {
          notifyError(result);
        }
      });
    }
  };

  return (
    <>
      <Avatar className="w-12 h-12 rounded-full">
        <AvatarFallback className="bg-secondary">{username[0].toUpperCase()}</AvatarFallback>
        {avatar && <AvatarImage src={avatar} className="object-cover pointer-events-none" />}
      </Avatar>
      <div>
        <p className="text-sm font-medium text-white">{username}</p>
        <p className="text-sm font-normal">{content}</p>
      </div>
      {gameInvit && (
        <Button onClick={joiningGame} className="ml-auto">
          Join
        </Button>
      )}
    </>
  );
};

export { MessageElement };
