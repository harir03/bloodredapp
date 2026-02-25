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

const COL = "leaderboard";

export const BADGES: Record<
  string,
  { label: string; minPoints: number; emoji: string }
> = {
  first_blood: { label: "First Blood", minPoints: 0, emoji: "🩸" },
  rising_star: { label: "Rising Star", minPoints: 100, emoji: "⭐" },
  dedicated: { label: "Dedicated", minPoints: 300, emoji: "💪" },
  hero: { label: "Hero", minPoints: 600, emoji: "🦸" },
  legend: { label: "Legend", minPoints: 1000, emoji: "🏆" },
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

    await setDoc(ref, {
      id: city,
      topVolunteers: entries,
      updatedAt: new Date().toISOString(),
    });
  },

  async addPoints(
    volunteerId: string,
    city: string,
    pointsToAdd: number,
    volunteerName: string,
    avatarUrl?: string,
  ): Promise<void> {
    // Update leaderboard city doc
    const cityRef = doc(db, COL, city);
    const snap = await getDoc(cityRef);
    let entries: LeaderboardEntry[] = snap.exists()
      ? ((snap.data().topVolunteers as LeaderboardEntry[]) ?? [])
      : [];

    const idx = entries.findIndex((e) => e.userId === volunteerId);
    if (idx >= 0) {
      entries[idx].points += pointsToAdd;
    } else {
      entries.push({
        userId: volunteerId,
        name: volunteerName,
        points: pointsToAdd,
        rank: 0,
        avatarUrl,
      });
    }

    entries.sort((a, b) => b.points - a.points);
    entries = entries.slice(0, 50).map((e, i) => ({ ...e, rank: i + 1 }));

    await setDoc(cityRef, {
      id: city,
      topVolunteers: entries,
      updatedAt: new Date().toISOString(),
    });

    // Also update volunteer doc points
    try {
      await updateDoc(doc(db, "volunteers", volunteerId), {
        points: increment(pointsToAdd),
      });
    } catch {
      // volunteer doc might not exist by volunteer id directly
    }
  },
};
