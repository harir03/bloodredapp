import { firebaseConfig } from "../config/env";

const GEMINI_API_KEY = firebaseConfig.geminiApiKey || firebaseConfig.apiKey;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export type NotificationTarget = "donor" | "volunteer";

interface AIData {
    userName: string;
    role: NotificationTarget;
    bloodGroup?: string;
    city?: string;
    taskCount?: number;
    unassignedTasks?: number;
    festival?: string;
}

export const aiService = {
    /**
     * Generates a "Zomato-style" witty notification message using REST API
     */
    generateWittyNotification: async (data: AIData): Promise<string> => {
        try {
            if (!GEMINI_API_KEY) {
                throw new Error("No Gemini API Key provided");
            }

            let systemPrompt = "";
            if (data.role === "donor") {
                systemPrompt = `
          Write a Zomato-style push notification message for a blood donor named ${data.userName}.
          Style: Flirty, romantic, quirky, witty, clever, and highly engaging.
          Context: Encourage them to donate blood. Use puns related to blood/hearts/love. 🩸😉
          ${data.festival ? `Current Festival: ${data.festival}` : ""}
          Donor's Blood Group: ${data.bloodGroup || "Unknown"}
          Location: ${data.city || "their city"}
          Guidelines: Max 100 characters. No quotes.
        `;
            } else {
                systemPrompt = `
          Write a Zomato-style push notification message for a volunteer named ${data.userName}.
          Style: Witty, clever, motivating, and quirky. 🦸‍♂️⚡
          Tasks Assigned: ${data.taskCount ?? 0}
          Unassigned Tasks: ${data.unassignedTasks ?? 0}
          Guidelines: Max 100 characters. No quotes.
        `;
            }

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: {
                        maxOutputTokens: 100,
                        temperature: 0.8,
                    },
                }),
            });

            const json = await response.json();
            const generatedText = json.candidates?.[0]?.content?.parts?.[0]?.text;

            return generatedText?.trim().replace(/^"|"$/g, "") || "Hero alert! Saving lives is the new cool. 🩸⚡";

        } catch (error) {
            console.error("AI Generation Error (REST):", error);
            // Fallback messages
            if (data.role === "donor") {
                return "Your heart beats for others, but your blood can save them. Date at the clinic? 🩸😉";
            } else {
                return `Hero alert! ${data.unassignedTasks ?? 5} tasks are lonelier than a single samosa. Help them out? 🦸‍♂️`;
            }
        }
    }
};
