import { corsHeaders } from "./cors.ts";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

export function jsonResponse<T>(
  data: T,
  status = 200
): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
}

export function errorResponse(
  message: string,
  status = 400,
  code?: string
): Response {
  return new Response(
    JSON.stringify({ success: false, error: message, code }),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
}

export function notFoundResponse(message = "Not found"): Response {
  return errorResponse(message, 404, "NOT_FOUND");
}

export function unauthorizedResponse(message = "Unauthorized"): Response {
  return errorResponse(message, 401, "UNAUTHORIZED");
}

export function serverErrorResponse(message = "Internal server error"): Response {
  return errorResponse(message, 500, "SERVER_ERROR");
}
