import { User } from "../types/user.interface";

const apiUrl: string = `${import.meta.env.VITE_BACK_URL}/user`;

const getUser = async (): Promise<User | null> => {
  try {
    const response = await fetch(`${apiUrl}/`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      console.log("Error:", data.message);
      return null;
    }

    return data;
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
      console.log("Error:", data.message);
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

interface ApiRes {
  success: boolean;
  message: string;
}

async function postUserAvatar(file: any): Promise<ApiRes> {
  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch("http://localhost:3000/user/avatar", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      console.log("Error:", data.message);
      return { success: false, message: data.message };
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "An error occurred while processing your request.",
    };
  }
}

export { getUser, getUserByUsername, getUserAvatar, postUserAvatar };
