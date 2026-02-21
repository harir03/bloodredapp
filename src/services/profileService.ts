import type { Profile } from "../types/database";
import type { ListResult, QueryOptions, ServiceResult } from "./baseService";
import {
    countRecords,
    create,
    fetchAll,
    fetchById,
    remove,
    update,
} from "./baseService";

const TABLE = "profiles";

export const profileService = {
  getAll: (options?: QueryOptions): Promise<ListResult<Profile>> =>
    fetchAll<Profile>(TABLE, options),

  getById: (id: string): Promise<ServiceResult<Profile>> =>
    fetchById<Profile>(TABLE, id),

  create: (
    profile: Omit<Profile, "id" | "created_at" | "updated_at"> & {
      id?: string;
    },
  ): Promise<ServiceResult<Profile>> => create<Profile>(TABLE, profile),

  update: (
    id: string,
    updates: Partial<Profile>,
  ): Promise<ServiceResult<Profile>> => update<Profile>(TABLE, id, updates),

  delete: (id: string) => remove(TABLE, id),

  count: (filters?: Record<string, any>) => countRecords(TABLE, filters),

  getByRole: (
    role: string,
    options?: QueryOptions,
  ): Promise<ListResult<Profile>> =>
    fetchAll<Profile>(TABLE, {
      ...options,
      filters: { ...options?.filters, role },
    }),
};

export default profileService;
