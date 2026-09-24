export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiPaginated<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

/** Normalised error surfaced to UI from axios / RTK Query. */
export interface NormalisedApiError {
  status: number;
  code: ApiErrorCode;
  message: string;
  requestId?: string;
  details?: unknown;
}

export function normaliseApiError(err: unknown): NormalisedApiError {
  const fallback: NormalisedApiError = {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
  };
  if (typeof err !== "object" || err === null) return fallback;
  const e = err as {
    status?: number;
    data?: ApiErrorBody;
    message?: string;
  };
  if (e.data && e.data.success === false) {
    return {
      status: e.status ?? 500,
      code: e.data.error.code,
      message: e.data.error.message,
      requestId: e.data.error.requestId,
      details: e.data.error.details,
    };
  }
  return {
    ...fallback,
    status: e.status ?? 500,
    message: e.message ?? fallback.message,
  };
}
