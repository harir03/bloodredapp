import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
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

  update: async (
    id: string,
    updates: Partial<HelplineCall>,
  ): Promise<ServiceResult<HelplineCall>> => {
    const result = await update<HelplineCall>(TABLE, id, updates);
    if (!result.error && updates.assigned_to) {
      try {
        const { notificationService } = require("./notificationService");
        const aId = updates.assigned_to;
        const aSnap = await getDoc(doc(db, "profiles", aId));
        const pushToken = aSnap.exists() ? aSnap.data().expoPushToken : undefined;

        await notificationService.send({
          userId: aId,
          title: "New Call Assigned",
          body: `You have been assigned a new helpline call: ${id}`,
          type: "task_assigned", // reused type for simplicity or can add more
          linkedEntity: { type: "volunteer", id: id } // using volunteer as placeholder for helpline call relation
        }, pushToken);
      } catch (e) {
        console.error("Error sending helpline notification:", e);
      }
    }
    return result;
  },

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
