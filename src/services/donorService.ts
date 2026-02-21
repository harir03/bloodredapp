import type { Donor } from "../types/database";
import type { ListResult, QueryOptions, ServiceResult } from "./baseService";
import {
    countRecords,
    create,
    fetchAll,
    fetchById,
    remove,
    update,
} from "./baseService";

const TABLE = "donors";

export const donorService = {
  getAll: (options?: QueryOptions): Promise<ListResult<Donor>> =>
    fetchAll<Donor>(TABLE, options),

  getById: (id: string): Promise<ServiceResult<Donor>> =>
    fetchById<Donor>(TABLE, id),

  create: (
    donor: Omit<Donor, "id" | "created_at" | "updated_at" | "total_donations">,
  ): Promise<ServiceResult<Donor>> => create<Donor>(TABLE, donor),

  update: (
    id: string,
    updates: Partial<Donor>,
  ): Promise<ServiceResult<Donor>> => update<Donor>(TABLE, id, updates),

  delete: (id: string) => remove(TABLE, id),

  count: (filters?: Record<string, any>) => countRecords(TABLE, filters),

  getByBloodGroup: (
    blood_group: string,
    options?: QueryOptions,
  ): Promise<ListResult<Donor>> =>
    fetchAll<Donor>(TABLE, {
      ...options,
      filters: { ...options?.filters, blood_group },
    }),

  getEligible: (options?: QueryOptions): Promise<ListResult<Donor>> =>
    fetchAll<Donor>(TABLE, {
      ...options,
      filters: { ...options?.filters, is_eligible: true },
    }),
};

export default donorService;
