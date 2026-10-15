import api from "./api";
import type { NotificationItem, Role, User } from "@/types";

function unwrapUsers(payload: unknown): User[] {
  const data = payload as { users?: User[]; data?: User[] } | User[];
  if (Array.isArray(data)) return data;
  return data?.users ?? data?.data ?? [];
}

export const userService = {
  async listUsers(params?: { role?: Role | "all"; search?: string }): Promise<User[]> {
    const { data } = await api.get("/users", { params });
    return unwrapUsers(data);
  },
  async updateProfile(payload: Partial<User>): Promise<User> {
    const { data } = await api.patch("/users/me", payload);
    const res = data as { user?: User } & User;
    return (res?.user ?? res) as User;
  },
  async updateUser(id: string, payload: Partial<User>): Promise<User> {
    const { data } = await api.patch(`/users/${encodeURIComponent(id)}`, payload);
    const res = data as { user?: User } & User;
    return (res?.user ?? res) as User;
  },
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${encodeURIComponent(id)}`);
  },
  async notifications(): Promise<NotificationItem[]> {
    const { data } = await api.get("/notifications");
    const res = data as { notifications?: NotificationItem[] } | NotificationItem[];
    if (Array.isArray(res)) return res;
    return res?.notifications ?? [];
  },
  async activityLogs(params?: { limit?: number }) {
    const { data } = await api.get("/activity", { params });
    const res = data as { logs?: unknown[] } | unknown[];
    return (Array.isArray(res) ? res : res?.logs ?? []) as Array<{
      id: string;
      actor?: string;
      action?: string;
      target?: string;
      createdAt?: string;
    }>;
  },
  async analytics(params?: { range?: string }) {
    const { data } = await api.get("/analytics", { params });
    return data as Record<string, unknown>;
  },
};

export default userService;
