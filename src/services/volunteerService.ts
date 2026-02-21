import type { Volunteer } from "../types/database";
import type { ListResult, QueryOptions, ServiceResult } from "./baseService";
import {
    countRecords,
    create,
    fetchAll,
    fetchById,
    remove,
    update,
} from "./baseService";

const TABLE = "volunteers";

export const volunteerService = {
  getAll: (options?: QueryOptions): Promise<ListResult<Volunteer>> =>
    fetchAll<Volunteer>(TABLE, options),

  getById: (id: string): Promise<ServiceResult<Volunteer>> =>
    fetchById<Volunteer>(TABLE, id),

  create: (
    volunteer: Omit<
      Volunteer,
      "id" | "created_at" | "updated_at" | "tasks_completed" | "points"
    >,
  ): Promise<ServiceResult<Volunteer>> => create<Volunteer>(TABLE, volunteer),

  update: (
    id: string,
    updates: Partial<Volunteer>,
  ): Promise<ServiceResult<Volunteer>> => update<Volunteer>(TABLE, id, updates),

  delete: (id: string) => remove(TABLE, id),

  count: (filters?: Record<string, any>) => countRecords(TABLE, filters),

  getByCity: (
    city: string,
    options?: QueryOptions,
  ): Promise<ListResult<Volunteer>> =>
    fetchAll<Volunteer>(TABLE, {
      ...options,
      filters: { ...options?.filters, city },
    }),

  getActive: (options?: QueryOptions): Promise<ListResult<Volunteer>> =>
    fetchAll<Volunteer>(TABLE, {
      ...options,
      filters: { ...options?.filters, status: "active" },
    }),
};

export default volunteerService;
