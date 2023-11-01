import { User } from "../types/user.interface";

const apiUrl: string = `${import.meta.env.VITE_BACK_URL}/user`;

interface ApiRes {
  success: boolean;
  message: string;
}

/* -------------------------------------------------------------------------- */
/*                                   General                                  */
/* -------------------------------------------------------------------------- */

const getUser = async (): Promise<User | null> => {
  try {
    const response = await fetch(`${apiUrl}/`, {
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

const getAllUsers = async (): Promise<User[] | null> => {
  try {
    const response = await fetch(`${apiUrl}/all`, {
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
};

/* -------------------------------------------------------------------------- */
/*                                  Username                                  */
/* -------------------------------------------------------------------------- */

async function postUsername(username: string): Promise<ApiRes> {
  try {
    const response = await fetch(`${apiUrl}/username`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
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

/* -------------------------------------------------------------------------- */
/*                                  Password                                  */
/* -------------------------------------------------------------------------- */

async function putUserPassword(
  password: string,
  newPassword: string
): Promise<ApiRes> {
  try {
    const response = await fetch(`${apiUrl}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, newPassword }),
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

/* -------------------------------------------------------------------------- */
/*                                   Avatar                                   */
/* -------------------------------------------------------------------------- */

function getUserAvatar(avatar: string): string {
  if (!avatar) {
    return "";
  }
  return `${apiUrl}/avatar/${avatar}`;
}

async function postUserAvatar(file: any): Promise<ApiRes> {
  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch(`${apiUrl}/avatar`, {
      method: "POST",
      body: formData,
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

export {
  getUser,
  getUserByUsername,
  getAllUsers,
  postUsername,
  putUserPassword,
  getUserAvatar,
  postUserAvatar,
};
