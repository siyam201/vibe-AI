import { supabase } from "@/integrations/supabase/client";

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export async function invokeFunction<T = unknown>(
  functionName: string,
  body?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
    });

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: data as T, success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { data: null, error: message, success: false };
  }
}
