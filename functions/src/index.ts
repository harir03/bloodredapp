import { GoogleGenAI } from "@google/genai";
import { Expo } from "expo-server-sdk";
import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

admin.initializeApp();
const db = admin.firestore();
const expo = new Expo();

// AI Implementation for Custom LLM Push Notifications
// Using the new @google/genai library (Kimi/Gemini v2 architecture)
export const onCriticalBloodRequest = onDocumentCreated(
    "blood_requests/{requestId}",
    async (event) => {
        const requestData = event.data?.data();
        if (!requestData) return;

        // Only fire for high-urgency notifications or if you want it on every request
        // Adjust logic as needed. We'll fire for "critical" requests.
        if (requestData.urgency !== "critical") return;

        const patientName = requestData.patientName || "A patient";
        const hospital = requestData.hospital || "the hospital";
        const city = requestData.city;
        const bloodGroupReq = requestData.bloodGroup;

        if (!city || !bloodGroupReq) return;

        // 1. Fetch matching Donors (Role-based targeting system)
        console.log(`Querying DB for role=donor, city=${city}, bloodGroup=${bloodGroupReq}`);

        // Using simple broad query first and filtering array out of caution
        // In production with proper indexes, you would chain .where() directly
        const snapshot = await db.collection("profiles")
            .where("role", "==", "donor")
            .get();

        if (snapshot.empty) {
            console.log(`No donors found in the database. Ending function.`);
            return;
        }

        const matchingDonors = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((d: any) =>
                d.expoPushToken &&
                d.city?.toLowerCase() === city?.toLowerCase() &&
                (d.blood_group === bloodGroupReq || d.blood_group === "O-") // O- is universal
            );

        if (matchingDonors.length === 0) {
            console.log(`No valid expoPushTokens found for matching donors.`);
            return;
        }

        // 2. Setup AI and push limits
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not defined. Falling back to generic notification.");
        }
        const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

        const messages = [];

        // 3. Process each donor
        for (const _donor of matchingDonors) {
            const donor = _donor as any;
            let pushMessage = `Urgent: ${bloodGroupReq} blood needed for ${patientName} at ${hospital} in ${city}.`;

            // Dynamic AI Hook for hyper-personalized messaging
            if (ai) {
                const prompt = `
          You are writing an urgent, 1-sentence push notification to a potential blood donor. 
          The donor's name is ${donor.name}. 
          The patient, ${patientName}, critically needs ${bloodGroupReq} blood at ${hospital} in ${city}.
          Write an emotional, desperate, and urgent plea asking ${donor.name} to help save a life. 
          Do not use quotes. Keep it under 100 characters so it fits on a phone lock screen.
        `;

                try {
                    // Gemini Call via standard unified AI architecture
                    const response = await ai.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: prompt
                    });

                    if (response.text) {
                        pushMessage = response.text.replace(/\\"/g, "");
                    }
                } catch (e) {
                    console.error("LLM Generation failed, using static text", e);
                }
            }

            // Ensure valid push token format
            if (Expo.isExpoPushToken(donor.expoPushToken)) {
                messages.push({
                    to: donor.expoPushToken,
                    sound: "default",
                    title: "🚨 Urgent Blood Required",
                    body: pushMessage,
                    data: { requestId: event.params.requestId, type: "critical_blood_request" },
                });
            }
        }

        // 4. Batch dispatch notifications to Expo API
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log("Expo API Ticket Chunk Results:", ticketChunk);
            } catch (error) {
                console.error("Error sending push to Expo Gateway:", error);
            }
        }
    }
);
