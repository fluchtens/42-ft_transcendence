import { User } from "../types/user.interface";

const API_URL: string = `${import.meta.env.VITE_BACK_URL}/friendship`;

async function getUserFriends(userId: number): Promise<User[] | null> {
  try {
    const response = await fetch(`${API_URL}/${userId}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      return null;
    }

    return data.friends;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export { getUserFriends };
