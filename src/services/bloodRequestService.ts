import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Unsubscribe,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "../config/firebase";
import { BloodRequest, ResponseLogEntry } from "../types/database";
import { sanitizeFirestoreData } from "./baseService";

const COL = "bloodRequests";

export const bloodRequestService = {
  async create(
    data: Omit<
      BloodRequest,
      "id" | "createdAt" | "responseLog" | "escalationLevel"
    >,
  ): Promise<BloodRequest> {
    const payload = {
      ...data,
      createdAt: new Date().toISOString(),
      escalationLevel: 0,
      responseLog: [],
    };
    const ref = await addDoc(collection(db, COL), payload);
    return { id: ref.id, ...payload } as BloodRequest;
  },

  async getById(id: string): Promise<BloodRequest | null> {
    const snap = await getDoc(doc(db, COL, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as BloodRequest;
  },

  async getAll(filters?: {
    city?: string;
    status?: BloodRequest["status"];
    urgency?: BloodRequest["urgency"];
  }): Promise<BloodRequest[]> {
    const conditions: ReturnType<typeof where>[] = [];
    if (filters?.city) conditions.push(where("city", "==", filters.city));
    if (filters?.status) conditions.push(where("status", "==", filters.status));
    if (filters?.urgency)
      conditions.push(where("urgency", "==", filters.urgency));

    const q = conditions.length
      ? query(collection(db, COL), ...conditions)
      : query(collection(db, COL), orderBy("createdAt", "desc"));

    const snap = await getDocs(q);
    const items = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as BloodRequest,
    );

    if (conditions.length) {
      items.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return items;
  },

  async getPending(): Promise<BloodRequest[]> {
    const q = query(
      collection(db, COL),
      where("status", "in", ["pending", "in_progress", "escalated"]),
    );
    const snap = await getDocs(q);
    const items = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as BloodRequest,
    );
    items.sort((a, b) => {
      const urgencyOrder = { critical: 0, medium: 1, low: 2 };
      return (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9);
    });
    return items;
  },

  subscribeToLive(
    callback: (requests: BloodRequest[]) => void,
    city?: string,
  ): Unsubscribe {
    const conditions: ReturnType<typeof where>[] = [
      where("status", "in", ["pending", "in_progress", "escalated"]),
    ];
    if (city) conditions.push(where("city", "==", city));

    const q = query(collection(db, COL), ...conditions);
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as BloodRequest,
      );
      items.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      callback(items);
    });
  },

  async updateStatus(
    id: string,
    status: BloodRequest["status"],
    by: string,
    byName?: string,
    extra?: Partial<BloodRequest>,
  ): Promise<void> {
    const logEntry: ResponseLogEntry = {
      timestamp: new Date().toISOString(),
      action: `Status changed to ${status}`,
      by,
      byName,
    };
    const ref = doc(db, COL, id);
    const snap = await getDoc(ref);
    const existing = snap.data();
    const responseLog: ResponseLogEntry[] = existing?.responseLog ?? [];
    await updateDoc(ref, sanitizeFirestoreData({
      status,
      ...(extra ?? {}),
      responseLog: [...responseLog, logEntry],
    }));

    // Sync with linked tasks — use require to avoid circular dependency
    try {
      console.log(`[Sync] Attempting task sync for Request: ${id}, Status: ${status}`);
      const { taskService } = require("./taskService");
      if (status === "completed") {
        await taskService.updateByRequestId(id, {
          status: "completed",
          completedAt: new Date().toISOString(),
        });
      } else if (status === "cancelled") {
        await taskService.updateByRequestId(id, {
          status: "cancelled",
        });
      }
    } catch (e) {
      console.error("[Sync] Failed to sync task status with blood request:", e);
    }
  },

  async assignVolunteer(
    id: string,
    volunteerId: string,
    volunteerName: string,
    by: string,
  ): Promise<void> {
    const logEntry: ResponseLogEntry = {
      timestamp: new Date().toISOString(),
      action: `Assigned to volunteer ${volunteerName}`,
      by,
    };
    const ref = doc(db, COL, id);
    const snap = await getDoc(ref);
    const data = snap.data();
    const responseLog: ResponseLogEntry[] = data?.responseLog ?? [];

    // Update the blood request
    await updateDoc(ref, {
      assignedVolunteerId: volunteerId,
      assignedVolunteerName: volunteerName,
      assignedAt: new Date().toISOString(),
      status: "in_progress",
      responseLog: [...responseLog, logEntry],
    });

    // Create a corresponding task for the volunteer
    try {
      const { taskService } = require("./taskService");
      await taskService.create({
        title: `Blood Donation: ${data?.patientName || 'Request'}`,
        description: `Assist with blood donation at ${data?.hospital || 'Hospital'} in ${data?.city || 'City'}.`,
        assignedTo: volunteerId,
        assignedToName: volunteerName,
        assignedBy: by,
        status: "pending",
        priority: data?.urgency === "critical" ? "high" : "medium",
        requestId: id,
        request_id: id, // legacy support
        city: data?.city,
        type: "blood_donation",
        points_reward: 50,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Failed to create task for blood request assignment:", e);
    }
  },

  async escalate(id: string, by: string): Promise<void> {
    const ref = doc(db, COL, id);
    const snap = await getDoc(ref);
    const data = snap.data();
    const currentLevel: number = data?.escalationLevel ?? 0;
    const newLevel = Math.min(currentLevel + 1, 3) as 0 | 1 | 2 | 3;
    const logEntry: ResponseLogEntry = {
      timestamp: new Date().toISOString(),
      action: `Escalated to level ${newLevel}`,
      by,
    };
    const responseLog: ResponseLogEntry[] = data?.responseLog ?? [];
    await updateDoc(ref, {
      escalationLevel: newLevel,
      status: "escalated",
      responseLog: [...responseLog, logEntry],
    });
  },

  async getRecentStats(): Promise<{
    total: number;
    pending: number;
    critical: number;
    resolved: number;
  }> {
    const all = await getDocs(collection(db, COL));
    const items = all.docs.map((d) => d.data() as BloodRequest);
    return {
      total: items.length,
      pending: items.filter((r) => r.status === "pending").length,
      critical: items.filter((r) => r.urgency === "critical").length,
      resolved: items.filter((r) => r.status === "completed").length,
    };
  },
};
