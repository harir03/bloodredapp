import type { BloodEvent } from "../types/database";
import type { ListResult, QueryOptions, ServiceResult } from "./baseService";
import {
    countRecords,
    create,
    fetchAll,
    fetchById,
    remove,
    update,
} from "./baseService";

const TABLE = "blood_events";

export const eventService = {
  getAll: (options?: QueryOptions): Promise<ListResult<BloodEvent>> =>
    fetchAll<BloodEvent>(TABLE, options),

  getById: (id: string): Promise<ServiceResult<BloodEvent>> =>
    fetchById<BloodEvent>(TABLE, id),

  create: (
    event: Omit<
      BloodEvent,
      "id" | "created_at" | "updated_at" | "registered_count"
    >,
  ): Promise<ServiceResult<BloodEvent>> => create<BloodEvent>(TABLE, event),

  update: (
    id: string,
    updates: Partial<BloodEvent>,
  ): Promise<ServiceResult<BloodEvent>> =>
    update<BloodEvent>(TABLE, id, updates),

  delete: (id: string) => remove(TABLE, id),

  count: (filters?: Record<string, any>) => countRecords(TABLE, filters),

  getUpcoming: (options?: QueryOptions): Promise<ListResult<BloodEvent>> =>
    fetchAll<BloodEvent>(TABLE, {
      ...options,
      filters: { ...options?.filters, status: "upcoming" },
      orderBy: "date",
      ascending: true,
    }),
};

export default eventService;
