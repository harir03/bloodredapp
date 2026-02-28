import {
    addDoc,
    collection,
    getDocs,
    orderBy,
    query,
    where
} from "firebase/firestore";
import { db } from "../config/firebase";
import { sanitizeFirestoreData } from "./baseService";

export type CertificateType = "donor" | "volunteer";

export interface Certificate {
    id: string;
    userId: string;
    userName: string;
    type: CertificateType;
    // Donor-specific
    bloodGroup?: string;
    unitsDonated?: number;
    // Volunteer-specific
    campaignName?: string;
    // Common
    eventName: string;
    date: string;
    issuedAt: string;
    serialNumber: string;
}

const COL = "certificates";

function generateSerial(type: CertificateType): string {
    const prefix = type === "donor" ? "BC-DON" : "BC-VOL";
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${ts}-${rand}`;
}

export const certificateService = {
    async getCertificatesForUser(userId: string): Promise<Certificate[]> {
        try {
            const q = query(
                collection(db, COL),
                where("userId", "==", userId),
                orderBy("issuedAt", "desc")
            );
            const snap = await getDocs(q);
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Certificate);
        } catch (e) {
            console.log("Error fetching certificates:", e);
            return [];
        }
    },

    async issueDonorCertificate(
        userId: string,
        userName: string,
        bloodGroup: string,
        unitsDonated: number,
        eventName: string,
        date: string
    ): Promise<Certificate> {
        const cert: Omit<Certificate, "id"> = {
            userId,
            userName,
            type: "donor",
            bloodGroup,
            unitsDonated,
            eventName,
            date,
            issuedAt: new Date().toISOString(),
            serialNumber: generateSerial("donor"),
        };
        const ref = await addDoc(
            collection(db, COL),
            sanitizeFirestoreData(cert)
        );
        return { id: ref.id, ...cert };
    },

    async issueVolunteerCertificate(
        userId: string,
        userName: string,
        campaignName: string,
        eventName: string,
        date: string
    ): Promise<Certificate> {
        const cert: Omit<Certificate, "id"> = {
            userId,
            userName,
            type: "volunteer",
            campaignName,
            eventName,
            date,
            issuedAt: new Date().toISOString(),
            serialNumber: generateSerial("volunteer"),
        };
        const ref = await addDoc(
            collection(db, COL),
            sanitizeFirestoreData(cert)
        );
        return { id: ref.id, ...cert };
    },
};
