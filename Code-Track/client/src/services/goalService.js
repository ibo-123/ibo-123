import api from "./api";

export const getGoals = async () => {
  const response = await api.get("/goals");
  return response.data.goals;
};

export const createGoal = async (goalData) => {
  const response = await api.post("/goals", goalData);
  return response.data.goal;
};

export const updateGoal = async (id, updateData) => {
  const response = await api.patch(`/goals/${id}`, updateData);
  return response.data.goal;
};

export const deleteGoal = async (id) => {
  const response = await api.delete(`/goals/${id}`);
  return response.data;
};
