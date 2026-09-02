/** Kontrak respons API KabarKode Backend (requirement §85). */

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

/** Error ternormalisasi untuk UI (requirement §40). */
export interface NormalizedApiError {
  code: string;
  message: string;
  status: number;
  fieldErrors?: Record<string, string[] | string>;
  requestId?: string;
}
