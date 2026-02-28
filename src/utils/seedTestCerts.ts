/**
 * Temporary utility to seed test certificates.
 * Import and call from any component once, then remove.
 * 
 * Usage: import { seedTestCertificates } from '../../utils/seedTestCerts';
 *        seedTestCertificates(); // Call once
 */
import {
    addDoc,
    collection,
    getDocs,
    query,
    where,
} from "firebase/firestore";
import { db } from "../config/firebase";

function generateSerial(type: "donor" | "volunteer"): string {
    const prefix = type === "donor" ? "BC-DON" : "BC-VOL";
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${ts}-${rand}`;
}

async function findUserByEmail(email: string) {
    const q = query(collection(db, "profiles"), where("email", "==", email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...(doc.data() as any) };
}

export async function seedTestCertificates() {
    try {
        // 1. Donor certificate for avansh@test.com
        const donorUser = await findUserByEmail("avansh@test.com");
        if (donorUser) {
            await addDoc(collection(db, "certificates"), {
                userId: donorUser.id,
                userName: donorUser.name || "Avansh",
                type: "donor",
                bloodGroup: donorUser.blood_group || "O+",
                unitsDonated: 1,
                eventName: "City Blood Donation Camp 2026",
                date: "2026-02-28",
                issuedAt: new Date().toISOString(),
                serialNumber: generateSerial("donor"),
            });
            console.log("✅ Donor certificate issued to avansh@test.com");
        } else {
            console.log("❌ avansh@test.com not found in profiles");
        }

        // 2. Volunteer certificate for volunteer_test@gmail.com
        const volUser = await findUserByEmail("volunteer_test@gmail.com");
        if (volUser) {
            await addDoc(collection(db, "certificates"), {
                userId: volUser.id,
                userName: volUser.name || "Volunteer Test",
                type: "volunteer",
                campaignName: "Diwali Blood Drive 2026",
                eventName: "Community Center Blood Camp",
                date: "2026-02-28",
                issuedAt: new Date().toISOString(),
                serialNumber: generateSerial("volunteer"),
            });
            console.log("✅ Volunteer certificate issued to volunteer_test@gmail.com");
        } else {
            console.log("❌ volunteer_test@gmail.com not found in profiles");
        }

        console.log("🎉 Test certificate seeding complete!");
    } catch (e) {
        console.error("Seed error:", e);
    }
}
