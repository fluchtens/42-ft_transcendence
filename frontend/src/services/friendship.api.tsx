import { AuthRes } from "../types/api.interface";
import { User } from "../types/user.interface";

const API_URL: string = `${import.meta.env.VITE_BACK_URL}/friendship`;

/* -------------------------------------------------------------------------- */
/*                                   General                                  */
/* -------------------------------------------------------------------------- */

async function getFriendsApi(userId: number): Promise<User[] | null> {
  try {
    const response = await fetch(`${API_URL}/${userId}`, {
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
/* -------------------------------------------------------------------------- */
/*                                  Requests                                  */
/* -------------------------------------------------------------------------- */

async function getFriendRequestsApi(): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/request/pending`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      return data;
    }

    return data;
  } catch (error) {
    console.log(error);
  }
}

async function sendFriendRequestApi(userId: number): Promise<AuthRes> {
  try {
    const response = await fetch(`${API_URL}/request/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
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

export { getFriendsApi, getFriendRequestsApi, sendFriendRequestApi };
