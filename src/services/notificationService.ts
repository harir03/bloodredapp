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
import { db } from "../config/firebase";
import { AppNotification } from "../types/database";

const COL = "notifications";

export const notificationService = {
  async send(
    data: Omit<AppNotification, "id" | "createdAt" | "read">,
  ): Promise<AppNotification> {
    const payload = {
      ...data,
      read: false,
      createdAt: new Date().toISOString(),
    };
    const ref = await addDoc(collection(db, COL), payload);
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
