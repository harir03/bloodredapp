import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { Platform } from "react-native";
import { db } from "../config/firebase";
import { AppNotification } from "../types/database";

const COL = "notifications";

// Configure notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  },

  async send(
    data: Omit<AppNotification, "id" | "createdAt" | "read">,
    pushToken?: string,
  ): Promise<AppNotification> {
    const payload = {
      ...data,
      read: false,
      createdAt: new Date().toISOString(),
    };
    const ref = await addDoc(collection(db, COL), payload);

    // Send local notification if pushToken is provided (or just send local always for now)
    if (pushToken) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: { ...data },
        },
        trigger: null,
      });
    }

    return { id: ref.id, ...payload } as AppNotification;
  },

  async getForUser(userId: string): Promise<AppNotification[]> {
    const q = query(collection(db, COL), where("userId", "==", userId));
    const snap = await getDocs(q);
    const items = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as AppNotification,
    );
    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return items;
  },

  subscribeForUser(
    userId: string,
    callback: (notifs: AppNotification[]) => void,
  ): Unsubscribe {
    const q = query(collection(db, COL), where("userId", "==", userId));
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as AppNotification,
      );
      items.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      callback(items);
    });
  },

  async markRead(id: string): Promise<void> {
    await updateDoc(doc(db, COL, id), { read: true });
  },

  async markAllRead(userId: string): Promise<void> {
    const q = query(
      collection(db, COL),
      where("userId", "==", userId),
      where("read", "==", false),
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
  },

  async getUnreadCount(userId: string): Promise<number> {
    const q = query(
      collection(db, COL),
      where("userId", "==", userId),
      where("read", "==", false),
    );
    const snap = await getDocs(q);
    return snap.size;
  },
};
