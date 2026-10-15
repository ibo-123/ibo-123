import api from "./api";

export const changePassword = async (data) => {

  const response = await api.put(
    "/settings/change-password",
    data
  );

  return response.data;

};