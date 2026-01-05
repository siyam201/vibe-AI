import { supabase } from "@/integrations/supabase/client";

export interface DbResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Type-safe database operations using direct supabase client
// For type safety, use supabase.from('table_name') directly in your components/hooks
// These helpers are for common patterns

export async function insertRow(
  table: "profiles" | "projects" | "chat_conversations" | "chat_messages" | "app_previews",
  data: Record<string, unknown>
): Promise<DbResult<unknown>> {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data as never)
    .select()
    .single();

  return {
    data: result,
    error: error?.message || null,
    success: !error,
  };
}

export async function updateRow(
  table: "profiles" | "projects" | "chat_conversations" | "chat_messages" | "app_previews",
  id: string,
  data: Record<string, unknown>
): Promise<DbResult<unknown>> {
  const { data: result, error } = await supabase
    .from(table)
    .update(data as never)
    .eq("id", id)
    .select()
    .single();

  return {
    data: result,
    error: error?.message || null,
    success: !error,
  };
}

export async function deleteRow(
  table: "profiles" | "projects" | "chat_conversations" | "chat_messages" | "app_previews",
  id: string
): Promise<DbResult<null>> {
  const { error } = await supabase.from(table).delete().eq("id", id);

  return {
    data: null,
    error: error?.message || null,
    success: !error,
  };
}

export async function getRowById<T = unknown>(
  table: "profiles" | "projects" | "chat_conversations" | "chat_messages" | "app_previews",
  id: string
): Promise<DbResult<T>> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  return {
    data: data as T | null,
    error: error?.message || null,
    success: !error,
  };
}

export async function getAllRows<T = unknown>(
  table: "profiles" | "projects" | "chat_conversations" | "chat_messages" | "app_previews",
  options?: { limit?: number }
): Promise<DbResult<T[]>> {
  let query = supabase.from(table).select("*");

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  return {
    data: data as T[] | null,
    error: error?.message || null,
    success: !error,
  };
}
