import api from "./api";

export const getAchievements = async () => {
  const response = await api.get("/achievements");
  return response.data.achievements;
};
