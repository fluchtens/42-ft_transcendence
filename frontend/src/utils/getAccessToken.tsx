export const getAccessToken = (): string | null => {
  const sessionToken = sessionStorage.getItem("access_token");
  if (sessionToken) {
    return sessionToken;
  }

  const localToken = localStorage.getItem("access_token");
  if (localToken) {
    return localToken;
  }

  return null;
};
