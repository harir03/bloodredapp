import type { HelplineCall } from "../types/database";
import type { ListResult, QueryOptions, ServiceResult } from "./baseService";
import {
    countRecords,
    create,
    fetchAll,
    fetchById,
    remove,
    update,
} from "./baseService";

const TABLE = "helpline_calls";

export const helplineService = {
  getAll: (options?: QueryOptions): Promise<ListResult<HelplineCall>> =>
    fetchAll<HelplineCall>(TABLE, options),

  getById: (id: string): Promise<ServiceResult<HelplineCall>> =>
    fetchById<HelplineCall>(TABLE, id),

  create: (
    call: Omit<HelplineCall, "id" | "created_at" | "updated_at">,
  ): Promise<ServiceResult<HelplineCall>> => create<HelplineCall>(TABLE, call),

  update: (
    id: string,
    updates: Partial<HelplineCall>,
  ): Promise<ServiceResult<HelplineCall>> =>
    update<HelplineCall>(TABLE, id, updates),

  delete: (id: string) => remove(TABLE, id),

  count: (filters?: Record<string, any>) => countRecords(TABLE, filters),

  getPending: (options?: QueryOptions): Promise<ListResult<HelplineCall>> =>
    fetchAll<HelplineCall>(TABLE, {
      ...options,
      filters: { ...options?.filters, status: "pending" },
    }),

  getByPriority: (
    priority: string,
    options?: QueryOptions,
  ): Promise<ListResult<HelplineCall>> =>
    fetchAll<HelplineCall>(TABLE, {
      ...options,
      filters: { ...options?.filters, priority },
    }),

  getEmergencies: (options?: QueryOptions): Promise<ListResult<HelplineCall>> =>
    fetchAll<HelplineCall>(TABLE, {
      ...options,
      filters: { ...options?.filters, call_type: "emergency" },
    }),
};

export default helplineService;
