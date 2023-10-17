import { User } from "../types/user.interface";

const apiUrl: string = `${import.meta.env.VITE_BACK_URL}/user`;

export const getUserProfile = async (): Promise<User | null> => {
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
