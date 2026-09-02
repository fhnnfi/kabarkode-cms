import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type { ApiErrorBody, ApiResponse, NormalizedApiError } from "@/types/api";
import { clearToken, getToken } from "@/lib/auth/token";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://kabarkodeapi.fhanalabs.site";
export const MEDIA_URL =
  process.env.NEXT_PUBLIC_MEDIA_URL ?? "https://cdn.fhanalabs.site";

const axiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

// Attach Bearer token dari penyimpanan terpusat (requirement §59).
axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Normalisasi error backend { success:false, error:{code,message,details} } (requirement §40). */
export function normalizeApiError(err: unknown): NormalizedApiError {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<ApiErrorBody>;
    const status = axiosErr.response?.status ?? 0;
    const body = axiosErr.response?.data;
    if (body && body.success === false && body.error) {
      const details = body.error.details as
        | { fieldErrors?: Record<string, string[] | string> }
        | undefined;
      return {
        code: body.error.code,
        message: body.error.message || fallbackMessage(status),
        status,
        fieldErrors: details?.fieldErrors,
        requestId: body.error.requestId,
      };
    }
    if (status === 0) {
      return {
        code: "NETWORK_ERROR",
        message: "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
        status: 0,
      };
    }
    return { code: "HTTP_ERROR", message: fallbackMessage(status), status };
  }
  if (err instanceof Error) {
    return { code: "UNKNOWN_ERROR", message: err.message, status: 0 };
  }
  return { code: "UNKNOWN_ERROR", message: "Terjadi kesalahan tak terduga.", status: 0 };
}

function fallbackMessage(status: number): string {
  switch (status) {
    case 401:
      return "Sesi berakhir. Silakan login kembali.";
    case 403:
      return "Anda tidak memiliki izin untuk aksi ini.";
    case 404:
      return "Data tidak ditemukan.";
    case 409:
      return "Konflik data — mungkin slug sudah dipakai.";
    case 429:
      return "Terlalu banyak percobaan. Coba lagi sebentar.";
    default:
      return status >= 500
        ? "Terjadi kesalahan pada server. Coba lagi."
        : "Permintaan gagal.";
  }
}

// 401 -> sesi dianggap habis: bersihkan token terpusat.
axiosInstance.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) clearToken();
    return Promise.reject(error);
  },
);

/** Helper typed: selalu buka { success, data, meta } backend. */
export async function apiRequest<T>(
  config: AxiosRequestConfig,
): Promise<{ data: T; meta?: ApiResponse<T>["meta"] }> {
  try {
    const res = await axiosInstance.request<ApiResponse<T>>(config);
    return { data: res.data.data, meta: res.data.meta };
  } catch (err) {
    throw normalizeApiError(err);
  }
}

export { axiosInstance };
