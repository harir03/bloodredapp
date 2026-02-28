import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "../config/firebase";
import { CityLeaderboard, LeaderboardEntry } from "../types/database";
import { sanitizeFirestoreData } from "./baseService";
import { notificationService } from "./notificationService";

const COL = "leaderboard";

export const BADGES: Record<
  string,
  { label: string; minPoints: number; emoji: string; description: string }
> = {
  new_recruit: {
    label: "New Recruit",
    minPoints: 0,
    emoji: "🔰",
    description: "Welcome to the team! Awarded for joining the community."
  },
  first_blood: {
    label: "First Blood",
    minPoints: 50,
    emoji: "🩸",
    description: "Your first impact! Awarded for donating blood or resolving a request."
  },
  rising_star: {
    label: "Rising Star",
    minPoints: 100,
    emoji: "⭐",
    description: "Off to a great start! Earned 100 points."
  },
  dedicated: {
    label: "Dedicated",
    minPoints: 300,
    emoji: "💪",
    description: "A true pillar of the community. Earned 300 points."
  },
  hero: {
    label: "Hero",
    minPoints: 600,
    emoji: "🦸",
    description: "Going above and beyond. Earned 600 points."
  },
  legend: {
    label: "Legend",
    minPoints: 1000,
    emoji: "🏆",
    description: "The stuff of legends. Earned 1000 points."
  },
  lifesaver: {
    label: "Lifesaver",
    minPoints: 0,
    emoji: "❤️‍🩹",
    description: "Your blood saved a life! Thank you for your incredible contribution."
  },
};

export const POINTS = {
  task_completed: 20,
  camp_attended: 30,
  blood_request_resolved: 50,
  donor_added: 15,
  event_organized: 40,
};

export function computeBadges(points: number): string[] {
  return Object.entries(BADGES)
    .sort((a, b) => a[1].minPoints - b[1].minPoints) // Ensure correct order
    .filter(([, v]) => points >= v.minPoints)
    .map(([k]) => k);
}

export const leaderboardService = {
  async getCityLeaderboard(city: string): Promise<CityLeaderboard | null> {
    const snap = await getDoc(doc(db, COL, city));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as CityLeaderboard;
  },

  async getAllCities(): Promise<CityLeaderboard[]> {
    const snap = await getDocs(collection(db, COL));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CityLeaderboard);
  },

  async updateCityLeaderboard(
    city: string,
    entry: LeaderboardEntry,
  ): Promise<void> {
    const ref = doc(db, COL, city);
    const snap = await getDoc(ref);
    let entries: LeaderboardEntry[] = snap.exists()
      ? ((snap.data().topVolunteers as LeaderboardEntry[]) ?? [])
      : [];

    const idx = entries.findIndex((e) => e.userId === entry.userId);
    if (idx >= 0) {
      entries[idx] = entry;
    } else {
      entries.push(entry);
    }

    entries.sort((a, b) => b.points - a.points);
    entries = entries.slice(0, 50).map((e, i) => ({ ...e, rank: i + 1 }));

    await setDoc(ref, sanitizeFirestoreData({
      id: city,
      topVolunteers: entries,
      updatedAt: new Date().toISOString(),
    }));
  },

  async addPoints(
    volunteerId: string,
    city: string,
    pointsToAdd: number,
    volunteerName: string,
    avatarUrl?: string,
  ): Promise<void> {
    // 1. Get current data to check for new badges
    let currentPoints = 0;
    try {
      const volSnap = await getDoc(doc(db, "volunteers", volunteerId));
      if (volSnap.exists()) {
        currentPoints = volSnap.data().points || 0;
      }
    } catch (e) {
      console.log("Error fetching volunteer for points check:", e);
    }

    const newPoints = currentPoints + pointsToAdd;
    const oldBadges = computeBadges(currentPoints);
    const newBadges = computeBadges(newPoints);
    const earnedNow = newBadges.filter(b => !oldBadges.includes(b));

    // 2. Update leaderboard city doc
    const cityRef = doc(db, COL, city);
    const snap = await getDoc(cityRef);
    let entries: LeaderboardEntry[] = snap.exists()
      ? ((snap.data().topVolunteers as LeaderboardEntry[]) ?? [])
      : [];

    const idx = entries.findIndex((e) => e.userId === volunteerId);
    if (idx >= 0) {
      entries[idx].points += pointsToAdd;
      entries[idx].badgeCount = newBadges.length;
    } else {
      entries.push({
        userId: volunteerId,
        name: volunteerName,
        points: newPoints,
        rank: 0,
        avatarUrl,
        badgeCount: newBadges.length,
      });
    }

    entries.sort((a, b) => b.points - a.points);
    entries = entries.slice(0, 50).map((e, i) => ({ ...e, rank: i + 1 }));

    await setDoc(cityRef, sanitizeFirestoreData({
      id: city,
      topVolunteers: entries,
      updatedAt: new Date().toISOString(),
    }));

    // 3. Update volunteer doc AND profile doc
    try {
      // Standardize: volunteerId is likely the Auth UID now
      const volRef = doc(db, "volunteers", volunteerId);
      const profRef = doc(db, "profiles", volunteerId);

      // Recursive sanitization for safety
      const updates = sanitizeFirestoreData({
        points: increment(pointsToAdd),
        badges: newBadges,
        updated_at: new Date().toISOString(),
      });

      await updateDoc(volRef, updates).catch(async () => {
        // Fallback: If UID isn't the doc ID, find by profile_id
        const { query, where, getDocs, collection } = require("firebase/firestore");
        const q = query(collection(db, "volunteers"), where("profile_id", "==", volunteerId));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          await updateDoc(doc(db, "volunteers", qSnap.docs[0].id), updates);
        }
      });

      // Mirror to profiles for UI performance (AllBadgesScreen, ProfileScreen)
      await updateDoc(profRef, updates).catch(() => {
        console.log("Profile doc not found for points mirror");
      });
    } catch (e) {
      console.error("Critical error in points sync:", e);
    }

    // 4. Send notifications for new badges
    for (const badgeKey of earnedNow) {
      const badge = BADGES[badgeKey];
      await notificationService.send({
        userId: volunteerId,
        title: "New Badge Earned! 🏆",
        body: `Congratulations! You've earned the ${badge.label} badge: ${badge.description}`,
        type: "badge_earned",
      });
    }
  },

  /**
   * Reconciles point/badge data from the 'volunteers' collection to the 'profiles' collection.
   * Useful for fixing legacy data or sync issues.
   */
  async reconcileProfileStats(uid: string): Promise<void> {
    try {
      console.log(`[Reconcile] Starting stats sync for ${uid}`);
      let points = 0;
      let badges: string[] = ["new_recruit"];

      // 1. Try finding by direct ID
      const volSnap = await getDoc(doc(db, "volunteers", uid));
      if (volSnap.exists()) {
        const data = volSnap.data();
        points = data.points || 0;
        badges = data.badges || computeBadges(points);
      } else {
        // 2. Try finding by profile_id query
        const { query, where, getDocs, collection } = require("firebase/firestore");
        const q = query(collection(db, "volunteers"), where("profile_id", "==", uid));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const data = qSnap.docs[0].data();
          points = data.points || 0;
          badges = data.badges || computeBadges(points);
        }
      }

      // 3. Update profile
      const profRef = doc(db, "profiles", uid);
      await updateDoc(profRef, sanitizeFirestoreData({
        points,
        badges,
        updated_at: new Date().toISOString()
      }));
      console.log(`[Reconcile] Successfully synced: ${points}pts, ${badges.length} badges`);
    } catch (e: any) {
      console.error("[Reconcile] Failed to reconcile stats:", e.message);
    }
  }
};

