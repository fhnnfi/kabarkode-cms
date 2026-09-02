import { apiRequest } from "@/lib/api/client";
import type { Author } from "@/types/models";

export const authorsApi = {
  list(): Promise<Author[]> {
    return apiRequest<Author[]>({ method: "GET", url: "/authors" }).then((r) => r.data);
  },
  create(body: {
    name: string;
    slug?: string;
    bio?: string | null;
    avatar_media_id?: string | null;
  }): Promise<Author> {
    return apiRequest<Author>({ method: "POST", url: "/authors", data: body }).then((r) => r.data);
  },
  update(
    id: string,
    body: Partial<{ name: string; slug: string; bio: string | null; avatar_media_id: string | null }>,
  ): Promise<Author> {
    return apiRequest<Author>({ method: "PATCH", url: `/authors/${id}`, data: body }).then(
      (r) => r.data,
    );
  },
  remove(id: string): Promise<void> {
    return apiRequest<null>({ method: "DELETE", url: `/authors/${id}` }).then(() => undefined);
  },
};
