const apiUrl: string = `${import.meta.env.VITE_BACK_URL}/api/auth`;

interface AuthApiResponse {
  success: boolean;
  message: string;
}

interface LoginUserResponse {
  success: boolean;
  message: string;
  token: string;
}

export async function registerUser(
  username: string,
  password: string
): Promise<AuthApiResponse> {
  try {
    const response = await fetch(`${apiUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
      return {
        success: true,
        message: data.message,
      };
    } else {
      return {
        success: false,
        message: data.message,
      };
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "An error occurred while processing your request.",
    };
  }
}

export async function loginUser(
  username: string,
  password: string
): Promise<LoginUserResponse> {
  try {
    const response = await fetch(`${apiUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    const data = await response.json();
    if (response.ok) {
      return {
        success: true,
        message: data.message,
        token: data.token,
      };
    } else {
      return {
        success: false,
        message: data.message,
        token: "",
      };
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "An error occurred while processing your request.",
      token: "",
    };
  }
}
