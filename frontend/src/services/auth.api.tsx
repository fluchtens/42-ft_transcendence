const apiUrl: string = `${import.meta.env.VITE_BACK_URL}/api/auth`;

interface AuthUser {
  username: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
}

export const registerUser = async ({
  username,
  password,
}: AuthUser): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${apiUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
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
};

export const loginUser = async ({
  username,
  password,
}: AuthUser): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${apiUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
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
};
