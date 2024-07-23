import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import AuthSettings from "./AuthSettings";
import ProfileSettings from "./ProfileSettings";
import UnlockUser from "./UnlockUser";

function Settings() {
  const { user } = useAuth();

  useEffect(() => {
    if (user === null) return;
  }, [user]);

  return (
    <>
      {user && (
        <Tabs defaultValue="profile" className="m-auto max-w-screen-lg">
          <TabsList className="w-full h-full grid grid-cols-1 md:grid-cols-2">
            <TabsTrigger value="profile">Public profile</TabsTrigger>
            <TabsTrigger value="auth">Password and authentification</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>
          <TabsContent value="auth">
            <AuthSettings />
            <UnlockUser />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}

export default Settings;
