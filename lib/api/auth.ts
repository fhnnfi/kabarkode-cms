import { apiRequest } from "@/lib/api/client";
import { setToken } from "@/lib/auth/token";
import type { AuthUser, LoginResult } from "@/types/models";

export const authApi = {
  async login(email: string, password: string): Promise<LoginResult> {
    const { data } = await apiRequest<LoginResult>({
      method: "POST",
      url: "/auth/login",
      data: { email, password },
    });
    setToken(data.accessToken);
    return data;
  },

  me(): Promise<AuthUser> {
    return apiRequest<AuthUser>({ method: "GET", url: "/auth/me" }).then((r) => r.data);
  },
};
