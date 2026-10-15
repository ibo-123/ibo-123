export const isLoggedIn = () => {
  // Check if we're in the browser environment
  if (typeof window === "undefined") {
    return false;
  }
  return !!localStorage.getItem("token");
};

export const getToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("token");
};

export const setToken = (token: string) => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem("token", token);
};

export const removeToken = () => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem("token");
};
