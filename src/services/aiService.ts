import { GoogleGenAI } from "@google/genai";
import { firebaseConfig } from "../config/env";

// We'll use the Firebase API key as a fallback if a dedicated GEMINI_API_KEY isn't provided, 
// though typically you'd want a separate one.
// @ts-ignore
const GEMINI_API_KEY = firebaseConfig.geminiApiKey || firebaseConfig.apiKey;

const genAI = new GoogleGenAI(GEMINI_API_KEY as string);

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
     * Generates a "Zomato-style" witty notification message
     */
    generateWittyNotification: async (data: AIData): Promise<string> => {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            let prompt = "";

            if (data.role === "donor") {
                prompt = `
          Write a Zomato-style push notification message for a blood donor named ${data.userName}.
          Style: Flirty, romantic, quirky, witty, clever, and highly engaging.
          Context: Encourage them to donate blood.
          ${data.festival ? `Current Festival: ${data.festival}` : ""}
          ${data.bloodGroup ? `Donor's Blood Group: ${data.bloodGroup}` : ""}
          ${data.city ? `Location: ${data.city}` : ""}
          
          Guidelines:
          - Use emojis.
          - Use puns related to blood/hearts/love.
          - Max 100 characters.
          - Make it sound like a funny text from a crush or a quirky food delivery app.
          - No quotes around the message.
        `;
            } else {
                prompt = `
          Write a Zomato-style push notification message for a volunteer named ${data.userName}.
          Style: Witty, clever, motivating, and quirky.
          Context: Inform them about their work.
          Tasks Assigned to them: ${data.taskCount ?? 0}
          Total Unassigned Ongoing Tasks: ${data.unassignedTasks ?? 0}
          ${data.festival ? `Current Festival: ${data.festival}` : ""}
          
          Guidelines:
          - Use emojis.
          - Use puns related to teamwork/heroism/delivery.
          - Mention that tasks are waiting for their "superhero" touch.
          - Max 100 characters.
          - No quotes around the message.
        `;
            }

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim().replace(/^"|"$/g, "");
        } catch (error) {
            console.error("AI Generation Error:", error);
            if (data.role === "donor") {
                return "Your heart beats for others, but your blood can save them. Date at the clinic? 🩸😉";
            } else {
                return `Hero alert! ${data.unassignedTasks ?? 5} tasks are lonelier than a single samosa. Help them out? 🦸‍♂️`;
            }
        }
    }
};
