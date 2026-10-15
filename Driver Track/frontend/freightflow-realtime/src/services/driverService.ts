import api from "./api";
import type { Driver } from "@/types";

function unwrapDrivers(payload: unknown): Driver[] {
  const data = payload as { drivers?: Driver[]; data?: Driver[] } | Driver[];
  if (Array.isArray(data)) return data;
  return data?.drivers ?? data?.data ?? [];
}

export const driverService = {
  async listDrivers(params?: { status?: string; search?: string }): Promise<Driver[]> {
    const { data } = await api.get("/drivers", { params });
    return unwrapDrivers(data);
  },
  async getDriver(id: string): Promise<Driver> {
    const { data } = await api.get(`/drivers/${encodeURIComponent(id)}`);
    const payload = data as { driver?: Driver } & Driver;
    return (payload?.driver ?? payload) as Driver;
  },
  async updateStatus(id: string, status: Driver["status"]): Promise<Driver> {
    const { data } = await api.patch(`/drivers/${encodeURIComponent(id)}/status`, { status });
    const payload = data as { driver?: Driver } & Driver;
    return (payload?.driver ?? payload) as Driver;
  },
  async stats(id?: string) {
    const { data } = await api.get(id ? `/drivers/${encodeURIComponent(id)}/stats` : "/drivers/me/stats");
    return data as {
      activeTrips?: number;
      completedTrips?: number;
      totalDistanceKm?: number;
      status?: Driver["status"];
    };
  },
};

export default driverService;
