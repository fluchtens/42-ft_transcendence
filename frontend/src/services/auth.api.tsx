import { AuthRes } from "../types/api.interface";

const API_URL: string = `${import.meta.env.VITE_BACK_URL}/auth`;

/* -------------------------------------------------------------------------- */
/*                                   General                                  */
/* -------------------------------------------------------------------------- */

interface AuthUser {
  username: string;
  password: string;
}

async function userRegistrationApi({
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

interface LoginRes {
  success: boolean;
  message: string;
  twoFa: boolean;
}

async function userLoginApi({
  username,
  password,
}: AuthUser): Promise<LoginRes> {
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

async function userLogoutApi(): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/logout`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(data.message);
    }
  } catch (error) {
    console.error(error);
  }
}

/* -------------------------------------------------------------------------- */
/*                                     42                                     */
/* -------------------------------------------------------------------------- */

async function setupUserApi(username: string): Promise<AuthRes> {
  try {
    const response = await fetch(`${API_URL}/setup`, {
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
/*                                     2FA                                    */
/* -------------------------------------------------------------------------- */

interface TwoFaSetupRes {
  success: boolean;
  message: string;
  qrcode?: string;
}

async function generateTwoFaQrCodeApi(): Promise<TwoFaSetupRes> {
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

async function enableTwoFaApi(code: string): Promise<AuthRes> {
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

async function disableTwoFaApi(): Promise<AuthRes> {
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

async function authUserTwoFaApi(code: string): Promise<AuthRes> {
  try {
    const response = await fetch(`${API_URL}/2fa/auth`, {
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

export {
  userRegistrationApi,
  userLoginApi,
  userLogoutApi,
  setupUserApi,
  generateTwoFaQrCodeApi,
  enableTwoFaApi,
  disableTwoFaApi,
  authUserTwoFaApi,
};
