import { AuthRes } from "../types/api.interface";
import { Friendship } from "../types/friendship.interface";
import { User } from "../types/user.interface";

const API_URL: string = `${import.meta.env.VITE_BACK_URL}/friendship`;
const ERR_MSG = "An error occurred while processing your request.";

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

async function removeFriendApi(userId: number): Promise<AuthRes> {
  try {
    const response = await fetch(`${API_URL}/remove`, {
      method: "PATCH",
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
    return { success: false, message: ERR_MSG };
  }
}

async function blockUserApi(userId: number): Promise<AuthRes> {
  try {
    const response = await fetch(`${API_URL}/block`, {
      method: "PATCH",
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
    return { success: false, message: ERR_MSG };
  }
}

async function unlockUserApi(userId: number): Promise<AuthRes> {
  try {
    const response = await fetch(`${API_URL}/unlock`, {
      method: "PATCH",
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
    return { success: false, message: ERR_MSG };
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Requests                                  */
/* -------------------------------------------------------------------------- */

async function getFriendRequestsApi(): Promise<Friendship[] | null> {
  try {
    const response = await fetch(`${API_URL}/request/pending`, {
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
    return { success: false, message: ERR_MSG };
  }
}

async function acceptFriendRequestApi(userId: number): Promise<AuthRes> {
  try {
    const response = await fetch(`${API_URL}/request/accept`, {
      method: "PATCH",
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
    return { success: false, message: ERR_MSG };
  }
}

async function declineFriendRequestApi(userId: number): Promise<AuthRes> {
  try {
    const response = await fetch(`${API_URL}/request/decline`, {
      method: "PATCH",
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
    return { success: false, message: ERR_MSG };
  }
}

export {
  getFriendsApi,
  removeFriendApi,
  blockUserApi,
  unlockUserApi,
  getFriendRequestsApi,
  sendFriendRequestApi,
  acceptFriendRequestApi,
  declineFriendRequestApi,
};
