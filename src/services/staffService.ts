import type { Staff } from "../types/database";
import type { ListResult, QueryOptions, ServiceResult } from "./baseService";
import {
    countRecords,
    create,
    fetchAll,
    fetchById,
    remove,
    update,
} from "./baseService";

const TABLE = "staff";

export const staffService = {
  getAll: (options?: QueryOptions): Promise<ListResult<Staff>> =>
    fetchAll<Staff>(TABLE, options),

  getById: (id: string): Promise<ServiceResult<Staff>> =>
    fetchById<Staff>(TABLE, id),

  create: (
    staffMember: Omit<Staff, "id" | "created_at" | "updated_at">,
  ): Promise<ServiceResult<Staff>> => create<Staff>(TABLE, staffMember),

  update: (
    id: string,
    updates: Partial<Staff>,
  ): Promise<ServiceResult<Staff>> => update<Staff>(TABLE, id, updates),

  delete: (id: string) => remove(TABLE, id),

  count: (filters?: Record<string, any>) => countRecords(TABLE, filters),

  getActive: (options?: QueryOptions): Promise<ListResult<Staff>> =>
    fetchAll<Staff>(TABLE, {
      ...options,
      filters: { ...options?.filters, status: "active" },
    }),
};

export default staffService;
