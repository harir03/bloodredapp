/**
 * One-time script: Seed test certificates for demo users.
 *
 * Run via: npx ts-node scripts/seedCertificates.ts
 * OR simply import and call seedTestCertificates() once from the app.
 */
import {
    addDoc,
    collection,
    getDocs,
    query,
    where,
} from "firebase/firestore";
import { db } from "../src/config/firebase";

async function findUserByEmail(email: string) {
    const q = query(collection(db, "profiles"), where("email", "==", email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
}

function generateSerial(type: "donor" | "volunteer"): string {
    const prefix = type === "donor" ? "BC-DON" : "BC-VOL";
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${ts}-${rand}`;
}

export async function seedTestCertificates() {
    console.log("🩸 Seeding test certificates...");

    // 1. Donor certificate for avansh@test.com
    const donorUser = await findUserByEmail("avansh@test.com");
    if (donorUser) {
        console.log("Found donor:", donorUser.id, (donorUser as any).name);
        await addDoc(collection(db, "certificates"), {
            userId: donorUser.id,
            userName: (donorUser as any).name || "Avansh",
            type: "donor",
            bloodGroup: (donorUser as any).blood_group || "O+",
            unitsDonated: 1,
            eventName: "City Blood Donation Camp 2026",
            date: "2026-02-28",
            issuedAt: new Date().toISOString(),
            serialNumber: generateSerial("donor"),
        });
        console.log("✅ Donor certificate issued to avansh@test.com");
    } else {
        console.log("❌ User avansh@test.com not found");
    }

    // 2. Volunteer certificate for volunteer_test@gmail.com
    const volUser = await findUserByEmail("volunteer_test@gmail.com");
    if (volUser) {
        console.log("Found volunteer:", volUser.id, (volUser as any).name);
        await addDoc(collection(db, "certificates"), {
            userId: volUser.id,
            userName: (volUser as any).name || "Volunteer Test",
            type: "volunteer",
            campaignName: "Diwali Blood Drive 2026",
            eventName: "Community Center Blood Camp",
            date: "2026-02-28",
            issuedAt: new Date().toISOString(),
            serialNumber: generateSerial("volunteer"),
        });
        console.log("✅ Volunteer certificate issued to volunteer_test@gmail.com");
    } else {
        console.log("❌ User volunteer_test@gmail.com not found");
    }

    console.log("🎉 Seeding complete!");
}
