import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AIHeroNotification } from "../components/ui/AIHeroNotification";
import { db } from "../config/firebase";
import { aiService } from "../services/aiService";
import { taskService } from "../services/taskService";
import { useAuth } from "./AuthProvider";

interface NotificationContextType {
    triggerNotification: (type?: "donor" | "volunteer") => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
    triggerNotification: async () => { },
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { profile, userRole, userName, userId } = useAuth();
    const [activeNotification, setActiveNotification] = useState<{
        message: string;
        type: "donor" | "volunteer";
    } | null>(null);

    const fetchAndShowNotification = useCallback(async (targetRole?: "donor" | "volunteer") => {
        if (!profile) return;

        const roleToUse = targetRole || (userRole === "volunteer" ? "volunteer" : "donor");

        let aiData: any = {
            userName: userName || "Hero",
            role: roleToUse,
            city: profile.city,
            bloodGroup: profile.blood_group,
        };

        if (roleToUse === "volunteer" && userId) {
            try {
                const { count: myTaskCount } = await taskService.getByVolunteer(userId);
                const { count: unassignedCount } = await taskService.getPending();
                aiData.taskCount = myTaskCount;
                aiData.unassignedTasks = unassignedCount;
            } catch (e) {
                console.error("Error fetching tasks for AI notification:", e);
            }
        }

        // Set a festive context if available (hardcoded for now, or based on date)
        const month = new Date().getMonth();
        const day = new Date().getDate();
        if (month === 2) aiData.festival = "Holi"; // March
        if (month === 9) aiData.festival = "Diwali"; // October
        if (month === 11 && day >= 20) aiData.festival = "Christmas";

        const message = await aiService.generateWittyNotification(aiData);
        setActiveNotification({ message, type: roleToUse });
    }, [profile, userRole, userName, userId]);

    useEffect(() => {
        // Initial delay for first notification
        if (profile) {
            const timer = setTimeout(() => {
                fetchAndShowNotification();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [profile, fetchAndShowNotification]);

    // Real-time listener for critical blood requests to trigger "Push-like" in-app alerts
    useEffect(() => {
        if (!profile || userRole !== "donor") return;

        const q = query(
            collection(db, "blood_requests"),
            where("urgency", "==", "critical"),
            where("status", "==", "pending"),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    // A new critical request was added!
                    fetchAndShowNotification("donor");
                }
            });
        });

        return unsubscribe;
    }, [profile, userRole, fetchAndShowNotification]);

    return (
        <NotificationContext.Provider value={{ triggerNotification: fetchAndShowNotification }}>
            {children}
            {activeNotification && (
                <AIHeroNotification
                    message={activeNotification.message}
                    type={activeNotification.type}
                    onClose={() => setActiveNotification(null)}
                    onPress={() => {
                        console.log("Notification Pressed!");
                        // Handle navigation here if needed
                    }}
                />
            )}
        </NotificationContext.Provider>
    );
};
