import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
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

  logDonation: async (id: string, units: number, camp?: string): Promise<void> => {
    const ref = doc(db, TABLE, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Donor not found");
    const data = snap.data() as Donor;

    // [ARIA] Track granular donation history for strict legally compliant intervals (usually 3 months)
    const newEntry = {
      date: new Date().toISOString(),
      camp,
      units
    };

    const h = data.donationHistory || [];
    const prevTotal = data.totalDonations || data.total_donations || 0;

    await updateDoc(ref, {
      donationHistory: [...h, newEntry],
      lastDonationDate: newEntry.date,
      last_donation_date: newEntry.date,
      totalDonations: prevTotal + 1,
      total_donations: prevTotal + 1,
      status: "deferred" // Prevents call algorithms from pinging them
    });
  }
};

export default donorService;
