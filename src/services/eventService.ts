import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
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
      ...options,
      filters: { ...options?.filters, status: "upcoming" },
      orderBy: "date",
      ascending: true,
    }),

  assignVolunteer: async (
    eventId: string,
    volunteerId: string
  ): Promise<void> => {
    const ref = doc(db, TABLE, eventId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Event not found");
    const data = snap.data() as BloodEvent;
    const existing = data.volunteersAssigned || [];
    if (!existing.includes(volunteerId)) {
      await updateDoc(ref, { volunteersAssigned: [...existing, volunteerId] });
    }
  },
};

export default eventService;
