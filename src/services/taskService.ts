import { supabase } from "../config/supabase";
import type { Task } from "../types/database";
import type { ListResult, QueryOptions, ServiceResult } from "./baseService";
import {
    countRecords,
    create,
    fetchAll,
    fetchById,
    remove,
    update,
} from "./baseService";

const TABLE = "tasks";

export const taskService = {
  getAll: (options?: QueryOptions): Promise<ListResult<Task>> =>
    fetchAll<Task>(TABLE, options),

  getById: (id: string): Promise<ServiceResult<Task>> =>
    fetchById<Task>(TABLE, id),

  create: (
    task: Omit<Task, "id" | "created_at" | "updated_at">,
  ): Promise<ServiceResult<Task>> => create<Task>(TABLE, task),

  update: (id: string, updates: Partial<Task>): Promise<ServiceResult<Task>> =>
    update<Task>(TABLE, id, updates),

  delete: (id: string) => remove(TABLE, id),

  count: (filters?: Record<string, any>) => countRecords(TABLE, filters),

  // Count tasks that are not completed or cancelled
  countActive: async (): Promise<{ count: number; error: string | null }> => {
    const { count, error } = await supabase
      .from(TABLE)
      .select("*", { count: "exact", head: true })
      .not("status", "in", '("completed","cancelled")');
    return { count: count || 0, error: error?.message || null };
  },

  getByVolunteer: (
    volunteerId: string,
    options?: QueryOptions,
  ): Promise<ListResult<Task>> =>
    fetchAll<Task>(TABLE, {
      ...options,
      filters: { ...options?.filters, assigned_to: volunteerId },
    }),

  getPending: (options?: QueryOptions): Promise<ListResult<Task>> =>
    fetchAll<Task>(TABLE, {
      ...options,
      filters: { ...options?.filters, status: "pending" },
    }),

  getByAssignedBy: (
    profileId: string,
    options?: QueryOptions,
  ): Promise<ListResult<Task>> =>
    fetchAll<Task>(TABLE, {
      ...options,
      filters: { ...options?.filters, assigned_by: profileId },
    }),
};

export default taskService;
