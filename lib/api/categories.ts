import { apiRequest } from "@/lib/api/client";
import type { Category } from "@/types/models";

export const categoriesApi = {
  list(): Promise<Category[]> {
    return apiRequest<Category[]>({ method: "GET", url: "/categories" }).then((r) => r.data);
  },
  create(body: { name: string; slug?: string; description?: string | null }): Promise<Category> {
    return apiRequest<Category>({ method: "POST", url: "/categories", data: body }).then((r) => r.data);
  },
  update(
    id: string,
    body: Partial<{ name: string; slug: string; description: string | null }>,
  ): Promise<Category> {
    return apiRequest<Category>({ method: "PATCH", url: `/categories/${id}`, data: body }).then(
      (r) => r.data,
    );
  },
  remove(id: string): Promise<void> {
    return apiRequest<null>({ method: "DELETE", url: `/categories/${id}` }).then(() => undefined);
  },
};
