import api from "./api";

export const getRecentSubmissions = async (limit = 10) => {
  const response = await api.get(`/submissions/recent?limit=${limit}`);
  return response.data.submissions;
};
