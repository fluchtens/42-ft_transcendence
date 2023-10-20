import { User } from "../types/user.interface";

const apiUrl: string = `${import.meta.env.VITE_BACK_URL}/user`;

const getUserProfile = async (): Promise<User | null> => {
  try {
    const response = await fetch(`${apiUrl}/`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      console.log("Error:", data.message);
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const response = await fetch(`${apiUrl}/username/${username}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      return null;
    }

    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function getUserAvatar(avatar: string): string {
  if (!avatar) {
    return "";
  } else if (avatar.startsWith("https://")) {
    return avatar;
  } else {
    return `${apiUrl}/avatar/${avatar}`;
  }
}

export { getUserProfile, getUserByUsername, getUserAvatar };
