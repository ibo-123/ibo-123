import api from "./api";

export const getAnalytics = async () => {
  const response = await api.get("/analytics");
  return response.data.analytics;
};

export const getHeatmap = async () => {
  const response = await api.get("/analytics/heatmap");
  return response.data.heatmap;
};

export const getProblemDistribution = async () => {
  const response = await api.get("/analytics/distribution");
  return response.data;
};