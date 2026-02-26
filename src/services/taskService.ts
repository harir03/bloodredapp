import {
  collection,
  doc,
  getCountFromServer,
  onSnapshot,
  orderBy,
  query,
  Unsubscribe,
  where
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Task } from "../types/database";
import type { ListResult, QueryOptions, ServiceResult } from "./baseService";
import {
  countRecords,
  create,
  fetchAll,
  fetchById,
  remove,
  update,
} from "./baseService";
import { leaderboardService } from "./leaderboardService";

const TABLE = "tasks";

export const taskService = {
  getAll: (options?: QueryOptions): Promise<ListResult<Task>> =>
    fetchAll<Task>(TABLE, options),

  getById: (id: string): Promise<ServiceResult<Task>> =>
    fetchById<Task>(TABLE, id),

  create: (
    task: Omit<Task, "id" | "created_at" | "updated_at">,
  ): Promise<ServiceResult<Task>> => create<Task>(TABLE, task),

  update: (id: string, updates: Partial<Task>): Promise<ServiceResult<Task>> =>
    update<Task>(TABLE, id, updates),

  delete: (id: string) => remove(TABLE, id),

  count: (filters?: Record<string, any>) => countRecords(TABLE, filters),

  // Count tasks that are not completed or cancelled
  countActive: async (): Promise<{ count: number; error: string | null }> => {
    try {
      const q = query(
        collection(db, TABLE),
        where("status", "not-in", ["completed", "cancelled"]),
      );
      const snap = await getCountFromServer(q);
      return { count: snap.data().count, error: null };
    } catch (e: any) {
      return { count: 0, error: e.message ?? "Count failed" };
    }
  },

  getByVolunteer: (
    volunteerId: string,
    options?: QueryOptions,
  ): Promise<ListResult<Task>> =>
    fetchAll<Task>(TABLE, {
      ...options,
      filters: { ...options?.filters, assigned_to: volunteerId },
    }),

  getPending: (options?: QueryOptions): Promise<ListResult<Task>> =>
    fetchAll<Task>(TABLE, {
      ...options,
      filters: { ...options?.filters, status: "pending" },
    }),

  getByAssignedBy: (
    profileId: string,
    options?: QueryOptions,
  ): Promise<ListResult<Task>> =>
    fetchAll<Task>(TABLE, {
      ...options,
      filters: { ...options?.filters, assigned_by: profileId },
    }),

  getByRequestId: async (requestId: string): Promise<ListResult<Task>> => {
    const cleanId = requestId?.trim();
    if (!cleanId) return { data: [], count: 0, error: "Empty request ID" };

    console.log(`[TaskQuery] getByRequestId: Searching for "${cleanId}"`);
    // Check both potential field names for robustness
    const { data: camel } = await fetchAll<Task>(TABLE, { filters: { requestId: cleanId } });
    const { data: snake } = await fetchAll<Task>(TABLE, { filters: { request_id: cleanId } });

    console.log(`[TaskQuery] Found ${camel.length} camelCase, ${snake.length} snake_case tasks`);
    const combined = [...camel];
    snake.forEach(s => {
      if (!combined.find(c => c.id === s.id)) {
        combined.push(s);
      }
    });
    return { data: combined, count: combined.length, error: null };
  },

  updateByRequestId: async (
    requestId: string,
    updates: Partial<Task>,
  ): Promise<void> => {
    console.log(`[TaskUpdate] updateByRequestId for ${requestId}`);
    const { data: tasks } = await taskService.getByRequestId(requestId);
    console.log(`[TaskUpdate] Found ${tasks.length} tasks to update`);
    for (const task of tasks) {
      console.log(`[TaskUpdate] Updating Task: ${task.id} to status: ${updates.status}`);
      const vId = task.assignedTo || task.assigned_to;
      // Only award points if we are moving TO completed FROM something else
      if (updates.status === "completed" && vId && task.status !== "completed") {
        try {
          console.log(`[TaskUpdate] Rewarding points to ${vId}`);
          await leaderboardService.addPoints(
            vId,
            task.city || "Unknown",
            task.points_reward || 0,
            task.assignedToName || "Volunteer",
          );
        } catch (e) {
          console.error("[TaskUpdate] Error rewarding points:", e);
        }
      }
      const result = await update<Task>(TABLE, task.id, updates);
      if (result.error) {
        console.error(`[TaskUpdate] Failed to update task ${task.id}: ${result.error}`);
      } else {
        console.log(`[TaskUpdate] Successfully updated task ${task.id}`);
      }
    }
  },

  acceptTask: async (taskId: string): Promise<ServiceResult<Task>> => {
    return update<Task>(TABLE, taskId, { status: "in_progress" });
  },

  completeTask: async (
    taskId: string,
    volunteerId: string,
    city: string,
    points: number,
    volunteerName: string,
  ): Promise<ServiceResult<Task>> => {
    const result = await update<Task>(TABLE, taskId, {
      status: "completed",
      completedAt: new Date().toISOString(),
    });

    if (!result.error) {
      // Reward points
      try {
        await leaderboardService.addPoints(
          volunteerId,
          city,
          points,
          volunteerName,
        );
      } catch (e) {
        console.error("Error rewarding points on task completion:", e);
      }

      // Sync back to blood request if linked
      try {
        const snap = await taskService.getById(taskId);
        const reqId = snap.data?.requestId || snap.data?.request_id;
        if (reqId) {
          // Use require to avoid circular dependency in React Native/Standard JS
          const { bloodRequestService } = require("./bloodRequestService");
          await bloodRequestService.updateStatus(
            reqId,
            "completed",
            volunteerId,
            volunteerName,
            { resolvedAt: new Date().toISOString() }
          );
        }
      } catch (e) {
        console.error("Error syncing back to blood request:", e);
      }
    }

    return result;
  },

  subscribeToTasks: (
    callback: (tasks: Task[]) => void,
    filters: Record<string, any> = {},
  ): Unsubscribe => {
    const constraints: any[] = [];
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        constraints.push(where(key, "==", value));
      }
    });

    const q = query(collection(db, TABLE), ...constraints, orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
  },

  subscribeToTaskById: (
    id: string,
    callback: (task: Task | null) => void,
  ): Unsubscribe => {
    return onSnapshot(doc(db, TABLE, id), (snap) => {
      if (!snap.exists()) {
        callback(null);
      } else {
        callback({ id: snap.id, ...snap.data() } as Task);
      }
    });
  },

  syncAllTasks: async (): Promise<{ updated: number; error: string | null }> => {
    try {
      console.log("[Maintenance] Starting global task sync...");
      const { data: allTasks } = await taskService.getAll({ limit: 500 });
      const { bloodRequestService } = require("./bloodRequestService");
      let updatedCount = 0;

      for (const task of allTasks) {
        const reqId = task.requestId || task.request_id;
        if (!reqId) continue;

        const request = await bloodRequestService.getById(reqId);
        if (!request) continue;

        // If request is completed/cancelled but task is not, sync it
        if ((request.status === "completed" || request.status === "cancelled") && task.status !== request.status) {
          console.log(`[Maintenance] Fixing task ${task.id} for request ${reqId} -> ${request.status}`);
          await update<Task>(TABLE, task.id, {
            status: request.status as any,
            completedAt: request.status === "completed" ? new Date().toISOString() : undefined
          });

          // Reward points if missed
          const vId = task.assignedTo || task.assigned_to;
          if (request.status === "completed" && vId) {
            await leaderboardService.addPoints(
              vId,
              task.city || request.city || "Unknown",
              task.points_reward || 50,
              task.assignedToName || "Volunteer"
            );
          }
          updatedCount++;
        }
      }
      console.log(`[Maintenance] Global sync finished. Updated ${updatedCount} tasks.`);
      return { updated: updatedCount, error: null };
    } catch (e: any) {
      console.error("[Maintenance] Global sync failed:", e);
      return { updated: 0, error: e.message };
    }
  }
};

export default taskService;
