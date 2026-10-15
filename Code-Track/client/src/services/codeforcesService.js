import api from "./api";

export const connectCodeforces = async (handle) => {
  const response = await api.post("/codeforces/connect", {
    handle,
  });

  return response.data;
};

export const getRatingHistory = async () => {
  const response = await api.get("/codeforces/history");

  return response.data;
};