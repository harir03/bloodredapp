// Firestore Database Types — BloodConnect Ops Architecture

export type UserRole =
  | "admin"
  | "city_manager"
  | "hr_manager"
  | "helpline"
  | "volunteer";

export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";

// /users/{userId}
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  city?: string;
  cluster?: string;
  status: "active" | "inactive";
  avatarUrl?: string;
  createdAt: string;
  lastActive?: string;
  fcmToken?: string;
  points: number;
  badges: string[];
}

// Profile is an alias kept for backward compat
export type Profile = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  blood_group?: BloodGroup | string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  city?: string;
  fcmToken?: string;
  points?: number;
  badges?: string[];
};

export interface AttendanceEntry {
  date: string;
  campId: string;
  status: "present" | "absent" | "late";
}

// /volunteers/{volunteerId}
export interface Volunteer {
  id: string;
  profile_id?: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  blood_group: BloodGroup | string;
  bloodGroup?: BloodGroup | string;
  skills: string[];
  area: string;
  city: string;
  cluster?: string;
  status: "active" | "inactive" | "on_leave";
  assigned_city_manager_id?: string;
  totalTasksCompleted: number;
  tasks_completed: number;
  totalCampsAttended: number;
  currentTaskId?: string | null;
  points: number;
  badges: string[];
  joinedAt: string;
  joined_at: string;
  lastActiveAt?: string;
  attendanceLog: AttendanceEntry[];
  created_at: string;
  updated_at: string;
}

export interface DonationHistoryEntry {
  date: string;
  camp?: string;
  units: number;
}

// /donors/{donorId}
export interface Donor {
  id: string;
  name: string;
  phone: string;
  email?: string;
  bloodGroup: BloodGroup | string;
  blood_group?: BloodGroup | string;
  city: string;
  area?: string;
  pincode?: string;
  age?: number;
  address?: string;
  lastDonationDate?: string;
  last_donation_date?: string;
  totalDonations: number;
  total_donations?: number;
  status: "available" | "unavailable" | "deferred";
  is_eligible?: boolean;
  privacyConsent: boolean;
  medicalNotes?: string;
  medical_notes?: string;
  donationHistory: DonationHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResponseLogEntry {
  timestamp: string;
  action: string;
  by: string;
  byName?: string;
}

export interface AIMatchResult {
  id: string;
  name: string;
  score: number;
  reason: string;
}

// /bloodRequests/{requestId}
export interface BloodRequest {
  id: string;
  requestedBy: string;
  requestedByName?: string;
  patientName: string;
  bloodGroup: BloodGroup | string;
  units: number;
  hospital: string;
  city: string;
  urgency: "low" | "medium" | "critical";
  status: "pending" | "in_progress" | "completed" | "escalated" | "cancelled";
  assignedVolunteerId?: string | null;
  assignedVolunteerName?: string;
  assignedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  escalationLevel: 0 | 1 | 2 | 3;
  notes?: string;
  responseLog: ResponseLogEntry[];
  aiMatchScore?: number;
  aiMatchResults?: {
    donors: AIMatchResult[];
    volunteers: AIMatchResult[];
  };
}

// /events/{eventId}
export interface BloodEvent {
  id: string;
  title: string;
  description?: string;
  city: string;
  cluster?: string;
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
  organizer: string;
  organizerName?: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  volunteersAssigned: string[];
  expectedDonors: number;
  actualDonors: number;
  leadsCollected: number;
  reportSummary?: string;
  createdAt: string;
  // Legacy compat
  event_type?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  registered_count?: number;
  created_at?: string;
  updated_at?: string;
}

// /tasks/{taskId}
export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedToName?: string;
  assignedBy: string;
  assignedByName?: string;
  eventId?: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  priority: "low" | "medium" | "high";
  points_reward?: number;
  requestId?: string;
  city?: string;
  location?: string;
  type?: "blood_donation" | "food_delivery" | "medical" | "logistics" | "other" | string;
  // Legacy compat
  assigned_to?: string;
  assigned_by?: string;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
}

// /notifications/{notificationId}
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type:
  | "task_assigned"
  | "request_matched"
  | "request_escalated"
  | "badge_earned"
  | "event_reminder"
  | "task_overdue"
  | "general";
  read: boolean;
  createdAt: string;
  linkedEntity?: {
    type: "request" | "task" | "event" | "volunteer";
    id: string;
  };
}

// /chatSessions/{sessionId}
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  requestId?: string;
  agentId: string;
  messages: ChatMessage[];
  createdAt: string;
}

// /leaderboard/{city}
export interface LeaderboardEntry {
  userId: string;
  name: string;
  points: number;
  rank: number;
  avatarUrl?: string;
  badgeCount?: number;
}

export interface CityLeaderboard {
  id: string;
  topVolunteers: LeaderboardEntry[];
  updatedAt: string;
}

// /staff/{staffId}
export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  city?: string;
  status: "active" | "inactive" | "on_leave";
  joined_at: string;
  created_at: string;
  updated_at: string;
}

// /helpline_calls — legacy
export interface HelplineCall {
  id: string;
  caller_name: string;
  caller_phone: string;
  call_type:
  | "blood_request"
  | "donor_inquiry"
  | "volunteer_inquiry"
  | "complaint"
  | "emergency"
  | "other";
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "resolved" | "escalated" | "closed";
  blood_group_needed?: string;
  units_needed?: number;
  hospital?: string;
  notes?: string;
  assigned_to?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}
