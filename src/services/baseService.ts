// Generic Firestore CRUD service
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export interface ListResult<T> {
  data: T[];
  count: number;
  error: string | null;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
  filters?: Record<string, any>;
  search?: { column: string; query: string };
}

function docToRecord<T>(id: string, data: Record<string, any>): T {
  return { id, ...data } as T;
}

/**
 * Recursively removes all 'undefined' values from an object/array.
 * Firestore rejects undefined but usually accepts null.
 */
export function sanitizeFirestoreData(data: any): any {
  if (data === undefined) return null; // Convert undefined to null at root
  if (data === null || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(v => sanitizeFirestoreData(v)).filter(v => v !== undefined);
  }

  const clean: any = {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== undefined) {
      clean[key] = sanitizeFirestoreData(value);
    }
  });
  return clean;
}

export async function fetchAll<T>(
  col: string,
  options: QueryOptions = {},
): Promise<ListResult<T>> {
  const {
    page = 1,
    limit: pageLimit = 25,
    orderBy: orderField = "created_at",
    ascending = false,
    filters = {},
    search,
  } = options;

  try {
    const constraints: QueryConstraint[] = [];
    const hasFilters = Object.values(filters).some(
      (v) => v !== undefined && v !== null && v !== "",
    );

    // Apply equality filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        constraints.push(where(key, "==", value));
      }
    });

    // Firestore requires a composite index when combining where() on one field
    // with orderBy() on a different field. To avoid that, only add server-side
    // orderBy when there are no filters; otherwise sort client-side below.
    if (!hasFilters) {
      constraints.push(orderBy(orderField, ascending ? "asc" : "desc"));
    }

    // For pagination: fetch up to page * limit docs and slice
    const fetchLimit = page * pageLimit;
    constraints.push(limit(fetchLimit));

    const q = query(collection(db, col), ...constraints);
    const snapshot = await getDocs(q);

    let docs = snapshot.docs.map((d) => docToRecord<T>(d.id, d.data()));

    // Client-side sort when filters are present (avoids composite index)
    if (hasFilters) {
      docs.sort((a: any, b: any) => {
        const aVal = a[orderField] ?? "";
        const bVal = b[orderField] ?? "";
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return ascending ? cmp : -cmp;
      });
    }

    // Client-side substring search (Firestore doesn't support ilike)
    if (search?.query) {
      const term = search.query.toLowerCase();
      docs = docs.filter((item: any) => {
        const val = item[search.column];
        return typeof val === "string" && val.toLowerCase().includes(term);
      });
    }

    // Slice for current page
    const start = (page - 1) * pageLimit;
    const pageData = docs.slice(start, start + pageLimit);

    return { data: pageData, count: docs.length, error: null };
  } catch (e: any) {
    console.error(`fetchAll(${col}) error:`, e.message);
    return { data: [], count: 0, error: e.message ?? "Fetch failed" };
  }
}

export async function fetchById<T>(
  col: string,
  id: string,
): Promise<ServiceResult<T>> {
  try {
    const snap = await getDoc(doc(db, col, id));
    if (!snap.exists()) return { data: null, error: null };
    return { data: docToRecord<T>(snap.id, snap.data()), error: null };
  } catch (e: any) {
    return { data: null, error: e.message ?? "Fetch failed" };
  }
}

export async function create<T>(
  col: string,
  record: Record<string, any>,
): Promise<ServiceResult<T>> {
  try {
    const now = new Date().toISOString();
    // Use recursive sanitization
    const cleaned = sanitizeFirestoreData({ ...record, created_at: now, updated_at: now });
    const { id: customId, ...rest } = cleaned;

    if (customId) {
      // Use provided ID (e.g. Firebase Auth UID for profiles)
      await setDoc(doc(db, col, customId), rest);
      return { data: docToRecord<T>(customId, rest), error: null };
    } else {
      // Let Firestore auto-generate the document ID
      const ref = await addDoc(collection(db, col), rest);
      return { data: docToRecord<T>(ref.id, rest), error: null };
    }
  } catch (e: any) {
    return { data: null, error: e.message ?? "Create failed" };
  }
}

export async function update<T>(
  col: string,
  id: string,
  updates: Record<string, any>,
): Promise<ServiceResult<T>> {
  try {
    const now = new Date().toISOString();
    // Use recursive sanitization
    const payload = sanitizeFirestoreData({ ...updates, updated_at: now });
    await updateDoc(doc(db, col, id), payload);
    const snap = await getDoc(doc(db, col, id));
    return {
      data: snap.exists() ? docToRecord<T>(snap.id, snap.data()) : null,
      error: null,
    };
  } catch (e: any) {
    return { data: null, error: e.message ?? "Update failed" };
  }
}

export async function remove(
  col: string,
  id: string,
): Promise<{ error: string | null }> {
  try {
    await deleteDoc(doc(db, col, id));
    return { error: null };
  } catch (e: any) {
    return { error: e.message ?? "Delete failed" };
  }
}

export async function countRecords(
  col: string,
  filters: Record<string, any> = {},
): Promise<{ count: number; error: string | null }> {
  try {
    const constraints: QueryConstraint[] = [];
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        constraints.push(where(key, "==", value));
      }
    });
    const q = query(collection(db, col), ...constraints);
    const snap = await getCountFromServer(q);
    return { count: snap.data().count, error: null };
  } catch (e: any) {
    return { count: 0, error: e.message ?? "Count failed" };
  }
}
