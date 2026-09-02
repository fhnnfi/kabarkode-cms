import { apiRequest } from "@/lib/api/client";
import type { Tag } from "@/types/models";

export const tagsApi = {
  list(): Promise<Tag[]> {
    return apiRequest<Tag[]>({ method: "GET", url: "/tags" }).then((r) => r.data);
  },
  create(body: { name: string; slug?: string }): Promise<Tag> {
    return apiRequest<Tag>({ method: "POST", url: "/tags", data: body }).then((r) => r.data);
  },
  update(id: string, body: Partial<{ name: string; slug: string }>): Promise<Tag> {
    return apiRequest<Tag>({ method: "PATCH", url: `/tags/${id}`, data: body }).then((r) => r.data);
  },
  remove(id: string): Promise<void> {
    return apiRequest<null>({ method: "DELETE", url: `/tags/${id}` }).then(() => undefined);
  },
};
