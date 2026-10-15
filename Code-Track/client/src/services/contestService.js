import api from "./api";

export const getUpcomingContests = async () => {

  const response = await api.get(
    "/contests/upcoming"
  );

  return response.data.contests;

};

export const getContestHistory = async () => {

  const response = await api.get(
    "/contests/history"
  );

  return response.data.history;

};