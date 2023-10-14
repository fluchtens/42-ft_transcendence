import { User } from "../types/user.interface";

const apiUrl: string = `${import.meta.env.VITE_BACK_URL}/api/user`;

export const getUserProfile = async (): Promise<User | null> => {
  try {
    const response = await fetch(`${apiUrl}/profile`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      console.error("Error:", data.message);
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};
