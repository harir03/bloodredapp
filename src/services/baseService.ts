// Generic Supabase CRUD service
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../config/supabase";

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export interface ListResult<T> {
  data: T[];
  count: number;
  error: string | null;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
  filters?: Record<string, any>;
  search?: { column: string; query: string };
}

function formatError(error: PostgrestError | null): string | null {
  if (!error) return null;
  return error.message || "An unknown error occurred";
}

export async function fetchAll<T>(
  table: string,
  options: QueryOptions = {},
): Promise<ListResult<T>> {
  const {
    page = 1,
    limit = 25,
    orderBy = "created_at",
    ascending = false,
    filters = {},
    search,
  } = options;

  let query = supabase
    .from(table)
    .select("*", { count: "exact" })
    .order(orderBy, { ascending })
    .range((page - 1) * limit, page * limit - 1);

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query = query.eq(key, value);
    }
  });

  // Apply text search
  if (search && search.query) {
    query = query.ilike(search.column, `%${search.query}%`);
  }

  const { data, error, count } = await query;

  return {
    data: (data as T[]) || [],
    count: count || 0,
    error: formatError(error),
  };
}

export async function fetchById<T>(
  table: string,
  id: string,
): Promise<ServiceResult<T>> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  return {
    data: data as T | null,
    error: formatError(error),
  };
}

export async function create<T>(
  table: string,
  record: Record<string, any>,
): Promise<ServiceResult<T>> {
  const { data, error } = await supabase
    .from(table)
    .insert(record)
    .select()
    .single();

  return {
    data: data as T | null,
    error: formatError(error),
  };
}

export async function update<T>(
  table: string,
  id: string,
  updates: Record<string, any>,
): Promise<ServiceResult<T>> {
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  return {
    data: data as T | null,
    error: formatError(error),
  };
}

export async function remove(
  table: string,
  id: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from(table).delete().eq("id", id);
  return { error: formatError(error) };
}

// Count records with optional filter
export async function countRecords(
  table: string,
  filters: Record<string, any> = {},
): Promise<{ count: number; error: string | null }> {
  let query = supabase.from(table).select("*", { count: "exact", head: true });

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query = query.eq(key, value);
    }
  });

  const { count, error } = await query;
  return { count: count || 0, error: formatError(error) };
}
