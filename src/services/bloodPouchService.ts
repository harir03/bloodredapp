import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { BloodPouch } from "../types/database";
import { notificationService } from "./notificationService";

const COL = "bloodPouches";

/**
 * Generates a unique blood pouch ID:  BP-YYYYMMDD-XXXXX
 */
function generatePouchId(): string {
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `BP-${dateStr}-${rand}`;
}

/**
 * Calculates expiry: blood is valid for ~42 days (6 weeks) from collection.
 */
function calcExpiry(collectionDate: string): string {
    const d = new Date(collectionDate);
    d.setDate(d.getDate() + 42);
    return d.toISOString().split("T")[0];
}

export const bloodPouchService = {
    /**
     * Create a new blood pouch entry.
     */
    create: async (
        data: Omit<BloodPouch, "id" | "pouchId" | "expiryDate" | "createdAt" | "status">
    ): Promise<BloodPouch> => {
        const pouchId = generatePouchId();
        const expiryDate = calcExpiry(data.collectionDate);

        const payload = {
            ...data,
            pouchId,
            expiryDate,
            status: "available" as const,
            createdAt: new Date().toISOString(),
        };

        const ref = await addDoc(collection(db, COL), payload);
        return { id: ref.id, ...payload };
    },

    /**
     * Get all pouches, optionally filtered.
     */
    getAll: async (filters?: {
        bloodGroup?: string;
        status?: BloodPouch["status"];
        city?: string;
    }): Promise<BloodPouch[]> => {
        const constraints: any[] = [orderBy("createdAt", "desc")];
        if (filters?.bloodGroup) constraints.push(where("bloodGroup", "==", filters.bloodGroup));
        if (filters?.status) constraints.push(where("status", "==", filters.status));
        if (filters?.city) constraints.push(where("city", "==", filters.city));

        const q = query(collection(db, COL), ...constraints);
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BloodPouch));
    },

    /**
     * Get all pouches collected by a specific user.
     */
    getByCollector: async (userId: string): Promise<BloodPouch[]> => {
        const q = query(
            collection(db, COL),
            where("collectedBy", "==", userId),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BloodPouch));
    },

    /**
     * Update pouch status.
     */
    updateStatus: async (id: string, status: BloodPouch["status"]): Promise<void> => {
        await updateDoc(doc(db, COL, id), { status });
    },

    /**
     * Mark a pouch as "used" and send a notification + lifesaver message to the donor.
     */
    markAsUsed: async (pouchId: string): Promise<void> => {
        const ref = doc(db, COL, pouchId);
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error("Pouch not found");

        const pouch = snap.data() as BloodPouch;

        // Update status
        await updateDoc(ref, { status: "used", usedAt: new Date().toISOString() });

        // Send notification to the donor
        if (pouch.donorUserId) {
            await notificationService.send({
                userId: pouch.donorUserId,
                title: "❤️‍🩹 Your Blood Saved a Life!",
                body: `Your donated ${pouch.bloodGroup} blood (Pouch #${pouch.pouchId}) has been used to save someone's life. You are a true hero! 🩸🦸 Share this amazing achievement with your friends!`,
                type: "lifesaver",
                data: {
                    pouchId: pouch.pouchId,
                    bloodGroup: pouch.bloodGroup,
                    donationDate: pouch.collectionDate,
                },
            });
        }
    },
};

export default bloodPouchService;
