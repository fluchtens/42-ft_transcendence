const API_URL: string = `${import.meta.env.VITE_BACK_URL}/auth`;

interface AuthUser {
  username: string;
  password: string;
}

interface AuthRes {
  success: boolean;
  message: string;
}

interface LoginRes {
  success: boolean;
  message: string;
  twoFa: boolean;
}

interface TwoFaSetupRes {
  success: boolean;
  message: string;
  qrcode?: string;
}

async function registerUser({
  username,
  password,
}: AuthUser): Promise<AuthRes> {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
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

async function loginUser({ username, password }: AuthUser): Promise<LoginRes> {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message, twoFa: false };
    }

    return { success: true, message: data.message, twoFa: data.twoFa };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "An error occurred while processing your request.",
      twoFa: false,
    };
  }
}

async function setupUser(username: string): Promise<AuthRes> {
  try {
    const response = await fetch(`${API_URL}/setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
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

async function logoutUser(): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/logout`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      console.log(data.message);
    }
  } catch (error) {
    console.error(error);
  }
}

async function generateUserTwoFaQrCode(): Promise<TwoFaSetupRes> {
  try {
    const response = await fetch(`${API_URL}/2fa/generate`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message };
    }

    return { success: true, message: data.message, qrcode: data.qrcode };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "An error occurred while processing your request.",
    };
  }
}

async function enableUserTwoFa(code: string): Promise<AuthRes> {
  try {
    const response = await fetch(`${API_URL}/2fa/enable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
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

async function disableUserTwoFa(): Promise<AuthRes> {
  try {
    const response = await fetch(`${API_URL}/2fa/disable`, {
      method: "GET",
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

async function authUserTwoFa(code: string): Promise<AuthRes> {
  try {
    const response = await fetch(`${API_URL}/2fa/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      credentials: "include",
    });

    const data = await response.json();
    console.log(data);
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
  registerUser,
  loginUser,
  setupUser,
  logoutUser,
  generateUserTwoFaQrCode,
  enableUserTwoFa,
  disableUserTwoFa,
  authUserTwoFa,
};
