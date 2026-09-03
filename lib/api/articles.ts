import { apiRequest } from "@/lib/api/client";
import type { ApiMeta } from "@/types/api";
import type { Article, ArticleListQuery } from "@/types/models";

export interface ArticleListResult {
  items: Article[];
  meta: ApiMeta;
}

export const articlesApi = {
  /** Daftar khusus staff: filter status bebas (draft/archived/published). */
  async listAll(query: ArticleListQuery): Promise<ArticleListResult> {
    const { data, meta } = await apiRequest<Article[]>({
      method: "GET",
      url: "/articles/admin/all",
      params: query,
    });
    return { items: data, meta: meta! };
  },

  /** Daftar khusus role author: hanya artikel milik sendiri (scoping server-side). */
  async listMine(query: ArticleListQuery): Promise<ArticleListResult> {
    const { data, meta } = await apiRequest<Article[]>({
      method: "GET",
      url: "/articles/mine",
      params: query,
    });
    return { items: data, meta: meta! };
  },

  get(id: string): Promise<Article> {
    return apiRequest<Article>({ method: "GET", url: `/articles/${id}` }).then((r) => r.data);
  },

  create(body: Record<string, unknown>): Promise<Article> {
    return apiRequest<Article>({ method: "POST", url: "/articles", data: body }).then((r) => r.data);
  },

  update(id: string, body: Record<string, unknown>): Promise<Article> {
    return apiRequest<Article>({ method: "PATCH", url: `/articles/${id}`, data: body }).then(
      (r) => r.data,
    );
  },

  publish(id: string): Promise<Article> {
    return apiRequest<Article>({ method: "POST", url: `/articles/${id}/publish` }).then((r) => r.data);
  },

  archive(id: string): Promise<Article> {
    return apiRequest<Article>({ method: "POST", url: `/articles/${id}/archive` }).then((r) => r.data);
  },

  remove(id: string): Promise<void> {
    return apiRequest<null>({ method: "DELETE", url: `/articles/${id}` }).then(() => undefined);
  },
};
